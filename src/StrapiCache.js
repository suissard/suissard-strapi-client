module.exports = class StrapiCache extends Map {
	find(func) {
		for (let [id, value] of this) if (func(value, id)) return value;
	}
};
