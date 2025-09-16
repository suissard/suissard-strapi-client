const StrapiObject = require("./StrapiObject");
const StrapiCache = require("./StrapiCache");

module.exports = class StrapiCollection {
	constructor(name, api) {
		this.api = api;
		this.name = name;
		this.cache = new StrapiCache();
	}

	/**
	 * https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/rest/filtering-locale-publication.html#filtering
	 * @param {Object} filter exemple : {title:{$eq:'Mon deuxieme article'}}
	 * $eq	Equal
	 * $ne	Not equal
	 * $lt	Less than
	 * $lte	Less than or equal to
	 * $gt	Greater than
	 * $gte	Greater than or equal to
	 * $in	Included in an array
	 * $notIn	Not included in an array
	 * $contains	Contains (case-sensitive)
	 * $notContains	Does not contain (case-sensitive)
	 * $containsi	Contains
	 * $notContainsi	Does not contain
	 * $null	Is null
	 * $notNull	Is not null
	 * $between	Is between
	 * $startsWith	Starts with
	 * $endsWith	Ends with
	 * $or	Joins the filters in an "or" expression
	 * $and	Joins the filters in an "and" expression
	 * @param {Array} fields entree qui doivent apparaitre
	 * @param {Array} populate Enrichir avec les objets liés (default = oui). https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/populate.html
	 */
	list(filters, fields, populate = "*", force) {
		let url = this.api.setUrl(this.name, filters, fields, populate);
		return this.api
			.GET(url + "&pagination[page]=1&pagination[pageSize]=100", force)
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
					response = await this.api.GET(url + `&pagination[page]=${i+1}&pagination[pageSize]=100`, force)
					getListPage(response)

				}

				return result;
			});
	}

	/**
	 * Recuperer un  element spécifique
	 * @param {String} id 
	 * @param {Object || String || Undefined} populate 
	 * @param {Boolean} force 
	 * @returns 
	 */
	get(id, populate = "*", force) {
		let url = this.api.setUrl(`${this.name}/${id}`, undefined, undefined, populate);
		return this.api.GET(url, force).then((response) => {
			let obj = new StrapiObject(id, this.name, response?.data.data.attributes, this);
			this.cache.set(obj.getID(), obj);
			return obj;
		});
	}

	/**
	 * Creer un object dans la base de données
	 * @param {*} body 
	 * @returns 
	 */
	create(body) {
		let url = this.api.setUrl(`${this.name}`);
		return this.api.POST(url, body).then((response) => {
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

	delete(id) {
		let url = this.api.setUrl(`${this.name}/${id}`);
		return this.api.DELETE(url).then((response) => {
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

	compareEntries(obj, entries) {
		for (let i in entries) {
			if (obj[i] !== entries[i]) return false;
		}
		return true;
	}

	update(id, body) {
		let url = this.api.setUrl(`${this.name}/${id}`);
		return this.api.PUT(url, body).then((response) => {
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
