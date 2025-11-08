const StrapiObject = require("./StrapiObject");
const StrapiCache = require("./StrapiCache");

/**
 * @class StrapiCollection
 * @description Classe pour gérer les opérations sur une collection Strapi.
 */
module.exports = class StrapiCollection {
	/**
	 * @constructor
	 * @param {string} name - Le nom de la collection.
	 * @param {StrapiApi} api - L'instance de la classe StrapiApi.
	 */
	constructor(name, api) {
		this.api = api;
		this.name = name;
		this.cache = new StrapiCache();
	}

	/**
	 * Récupère une liste d'éléments de la collection.
	 * @see https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/rest/filtering-locale-publication.html#filtering
	 * @param {Object} [filters] - Les filtres à appliquer. Exemple : `{title:{$eq:'Mon deuxieme article'}}`
	 * @param {Array<string>} [fields] - Les champs à retourner.
	 * @param {Array<string>|string} [populate="*"] - Les relations à enrichir.
	 * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
	 * @returns {Promise<Array<StrapiObject>>} Une promesse qui résout avec un tableau d'objets Strapi.
	 */
	list(filters, fields, populate = "*", force) {
		let url = this.api.setUrl(this.name, filters, fields, populate);
		return this.api
			.get(url + "&pagination[page]=1&pagination[pageSize]=100", force)
			.then(async (response) => {
				let result = [];

				let getListPage = (response) => {
					for (let i in response?.data.data) {
						let object = response?.data.data[i];
						if (object.id && object.attributes) {
							let obj = new StrapiObject(object.id, this.name, object.attributes, this);
							this.cache.set(obj.getID(), obj);
							result.push(obj);
						}
					}
				};

				getListPage(response)

				for (let i=1; i < response.data.meta.pagination.pageCount; i++) {
					response = await this.api.get(url + `&pagination[page]=${i+1}&pagination[pageSize]=100`, force)
					getListPage(response)

				}

				return result;
			});
	}

	/**
	 * Récupère un élément spécifique par son ID.
	 * @param {string} id - L'ID de l'élément.
	 * @param {Array<string>|string} [populate="*"] - Les relations à enrichir.
	 * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet Strapi.
	 */
	get(id, populate = "*", force) {
		let url = this.api.setUrl(`${this.name}/${id}`, undefined, undefined, populate);
		return this.api.get(url, force).then((response) => {
			let obj = new StrapiObject(id, this.name, response?.data.data.attributes, this);
			this.cache.set(obj.getID(), obj);
			return obj;
		});
	}

	/**
	 * Crée un nouvel élément dans la collection.
	 * @param {Object} body - Le corps de l'élément à créer.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec le nouvel objet Strapi.
	 */
	create(body) {
		let url = this.api.setUrl(`${this.name}`);
		return this.api.post(url, body).then((response) => {
			if (!response?.data?.data) return;
			let obj = new StrapiObject(
				String(response.data.data.id),
				this.name,
				response.data.data.attributes,
				this
			);
			this.cache.set(obj.getID(), obj);
			return obj;
		});
	}

	/**
	 * Supprime un élément de la collection.
	 * @param {string} id - L'ID de l'élément à supprimer.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet Strapi supprimé.
	 */
	delete(id) {
		let url = this.api.setUrl(`${this.name}/${id}`);
		return this.api.delete(url).then((response) => {
			if (!response?.data?.data) return;
			let obj = this.cache.get(String(id));
			if (obj) {
				this.cache.delete(id);
			}
			return new StrapiObject(
				response.data.data.id,
				this.name,
				response.data.data.attributes,
				this
			);
		});
	}

	/**
	 * Compare les entrées d'un objet avec un autre objet.
	 * @param {Object} obj - L'objet à comparer.
	 * @param {Object} entries - Les entrées à comparer.
	 * @returns {boolean} `true` si les entrées sont identiques, sinon `false`.
	 * @private
	 */
	compareEntries(obj, entries) {
		for (let i in entries) {
			if (obj[i] !== entries[i]) return false;
		}
		return true;
	}

	/**
	 * Met à jour un élément de la collection.
	 * @param {string} id - L'ID de l'élément à mettre à jour.
	 * @param {Object} body - Le corps de l'élément à mettre à jour.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet Strapi mis à jour.
	 */
	update(id, body) {
		let url = this.api.setUrl(`${this.name}/${id}`);
		return this.api.put(url, body).then((response) => {
			if (!response?.data?.data) return;
			let obj = this.cache.get(String(id));
			if (obj && !this.compareEntries(obj, body)) {
				obj.update(body);
			} else {
				obj = new StrapiObject(
					response.data.data.id,
					this.name,
					response.data.data.attributes,
					this
				);
				this.cache.set(obj.getID(), obj);
			}
			return obj;
		});
	}
};
