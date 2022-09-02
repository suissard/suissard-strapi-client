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

		for (let i in value) this[i] = value[i];
	}

	update(data) {
		return this.getCollection().update(this.getID(), data);
	}
	delete() {
		return this.getCollection().delete(this.getID());
	}
	refresh() {
		return this.getCollection().get(this.getID(), true);
	}
};
