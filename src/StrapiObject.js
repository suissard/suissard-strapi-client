/**
 * Object fournit par la base de donnée Strapi
 */
module.exports = class StrapiObject {
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

	update(data) {
		for (let i in data) this[i] = data[i];
		return this.getCollection().update(this.getID(), data);
	}
	delete() {
		return this.getCollection().delete(this.getID());
	}
	refresh() {
		return this.getCollection().get(this.getID(), true);
	}

	/**
	 * Convert data from DataBase (URI)
	 * @param {Object} value default value will be this
	 * @returns {Object}
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
	 * Convert data to DataBase format (URI)
	 * @param {Object} value default value will be this
	 * @returns {Object}
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
