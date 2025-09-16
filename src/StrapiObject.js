/**
 * @class StrapiObject
 * @description Classe représentant un objet de la base de données Strapi.
 */
module.exports = class StrapiObject {
	/**
	 * @constructor
	 * @param {string} id - L'ID de l'objet.
	 * @param {string} type - Le type de l'objet (nom de la collection).
	 * @param {Object} value - Les attributs de l'objet.
	 * @param {StrapiCollection} collection - L'instance de la collection parente.
	 */
	constructor(id, type, value, collection) {
		// console.log('StrapiObject', 'id : ' + id, 'type : ' + type, value)
		Object.defineProperty(this, "getID", {
			enumerable: false, value: () => String(id)
		});

		Object.defineProperty(this, "getType", {
			enumerable: false, value: () => type
		});

		Object.defineProperty(this, "getCollection", {
			enumerable: false, value: () => collection
		});

		value = this.changeFromDB(value);
		for (let i in value) this[i] = value[i];
	}

	/**
	 * Met à jour l'objet avec de nouvelles données.
	 * @param {Object} data - Les nouvelles données.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet mis à jour.
	 */
	update(data) {
		for (let i in data) this[i] = data[i];
		return this.getCollection().update(this.getID(), data);
	}

	/**
	 * Supprime l'objet de la base de données.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet supprimé.
	 */
	delete() {
		return this.getCollection().delete(this.getID());
	}

	/**
	 * Rafraîchit les données de l'objet depuis la base de données.
	 * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet rafraîchi.
	 */
	refresh() {
		return this.getCollection().get(this.getID(), true);
	}

	/**
	 * Convertit les données de la base de données (décode les URI).
	 * @param {Object} [value=this] - L'objet à convertir.
	 * @returns {Object} L'objet converti.
	 * @private
	 */
	changeFromDB(value) {
		let decodeURIObject = function (obj) {
			let target = {};
			if (obj instanceof Array) target = []

			for (let i in obj) {
				let indexTarget = typeof i == "string" ? decodeURIComponent(i) : i;
				if (obj[i] instanceof Object) target[indexTarget] = decodeURIObject(obj[i]);
				else if (typeof obj[i] == "string")
					target[indexTarget] = decodeURIComponent(obj[i]);
				else target[indexTarget] = obj[i];
			}
			return target;
		};

		return decodeURIObject(value || this);
	}

	/**
	 * Convertit les données au format de la base de données (encode les URI).
	 * @param {Object} [value=this] - L'objet à convertir.
	 * @returns {Object} L'objet converti.
	 * @private
	 */
	changeToDB(value) {
		let encodeURIObject = function (obj) {
			let target = {};
			if (obj instanceof Array) target = []

			for (let i in obj) {
				let indexTarget = typeof i == "string" ? encodeURIComponent(i) : i;
				if (obj[i] instanceof Object) target[indexTarget] = encodeURIObject(obj[i]);
				else if (typeof obj[i] == "string")
					target[indexTarget] = encodeURIComponent(obj[i]);
				else target[indexTarget] = obj[i];
			}
			return target;
		};

		return encodeURIObject(value || this);
	}
};
