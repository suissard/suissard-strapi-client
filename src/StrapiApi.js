const StrapiCollection = require("./StrapiCollections.js");
const axios = require("axios");

const qs = require("qs");

module.exports = class StrapiApi {
	constructor(baseURL, collections = [], token, prefix = "api") {
		this.baseURL = baseURL;
		this.setCollection(collections);
		this.setToken(token);
		this.prefix = prefix + "/";

		this.axios = axios.create();
		this.logRequest = {};
	}

	/**
	 * Définir le token pour les requêtes
	 * @param {String} token
	 * @returns {String} token
	 */
	setToken(token) {
		this.token = token;
		return this.token;
	}

	/**
	 * Parametre les collections auquel acceder
	 * @param {Arrray} collections si pas de tableau fournit, tente de recupérer la liste des collections
	 * @returns {Object} collections
	 */
	async setCollection(collections) {
		if (!collections) collections = await this.getAllCollectionsName();
		if (!collections) throw new Error("Impossible de recupérer les collections");
		this.collections = {};
		for (let collection of collections)
			this.collections[collection] = new StrapiCollection(collection, this);
		return this.collections;
	}

	/**
	 * Renvoie une url construite avec les options propres a strapi
	 * @param {String} subUrl url de la requete
	 * @param {Object} filters filtre de la requete
	 * @param {Array} fields champs de la requete
	 * @param {Array} populate Comment la requete doit etre enrichit par d'autres sous-elements
	 * @returns
	 */
	setUrl(subUrl, filters, fields, populate) {
		return `${subUrl.replace(/([a-z])([A-Z])/g, "$1-$2")}?${qs.stringify(
			{ filters, fields, populate },
			{ encodeValuesOnly: true }
		)}`;
	}

	/**
	 * Renvoie le header avec le token
	 * @returns {Object} token
	 */
	getHeader() {
		return { Authorization: `Bearer ${this.token}` };
	}

	/**
	 * Focntion de requete multifonction avec stockage en cache des requete GET
	 * @param {String} url Url de la requete
	 * @param {String} method Methode de la requete
	 * @param {Object} data Données de la requete
	 * @param {Boolean} force default = false. Si true, force la requete sans tenir compte du cache
	 * @returns {Promise}
	 */
	async request(url, method, data, force) {
		if (this.logRequest[method + url] && !force && method == "GET")
			return this.logRequest[method + url];
		let result = await this.axios({
			url,
			method,
			data,
			headers: this.getHeader(),
			baseURL: this.baseURL + "/",
		}).catch((e) => console.error(e));
		// console.log(method, url, result);
		this.logRequest[method.toUpperCase() + url] = result;
		return result;
	}

	/**
	 * Requete de recupération de données
	 * @param {String} url
	 * @param {Boolean} force
	 * @returns
	 */
	async GET(url, force) {
		return this.request(this.prefix + url, "GET", undefined, force);
	}

	/**
	 * Requete d'envoie de données
	 * @param {String} url
	 * @param {Object} body
	 * @returns
	 */
	async POST(url, body) {
		return this.request(this.prefix + url, "POST", { data: body });
	}

	/**
	 * Requete de mise a jour de données
	 * @param {String} url
	 * @param {Object} body
	 * @returns
	 */
	async PUT(url, body) {
		return this.request(this.prefix + url, "PUT", { data: body });
	}

	/**
	 * Requete de supression de données
	 * @param {String} url
	 * @param {Object} body
	 * @returns
	 */
	async DELETE(url, body) {
		return this.request(this.prefix + url, "DELETE", body);
	}

	/**
	 * Renvoie la liste des collections disponibles dans la base, sans les collections de base de strapi
	 * @returns {Array} Promise d'array du nom des collections disponibles
	 */
	getAllCollectionsName() {
		let notCollection = [
			"admin_permissions",
			"admin_users",
			"admin_roles",
			"strapi_api_tokens",
			"files",
			"up_permissions",
			"up_roles",
			"up_users",
			"i18n_locale",
		];
		return this.request("/content-type-builder/content-types", "get").then((response) => {
			return response?.data.data
				.filter(
					(data) =>
						data.schema.kind == "collectionType" &&
						!notCollection.includes(data.schema.collectionName)
				)
				.map((data) => data.schema.collectionName);
		});
	}

	/**
	 * Recuperer la totalité des données dans les collections qui ont été définis
	 * @returns {Object} Promise d'object de la totalité des données
	 */
	async getAllData() {
		let result = {};
		for (let i in this.collections) result[i] = await this.collections[i].list();
		return result;
	}

	/**
	 * Requete de registration d'un utilisateur
	 * @param {String} username
	 * @param {String} email
	 * @param {String} password
	 * @returns
	 */
	register(username, email, password) {
		return this.POST("auth/local/register", {
			username,
			email,
			password,
		});
	}

	/**
	 * Requete de login d'un utilisateur qui ajoute le token renvoyé
	 * @param {*} identifier
	 * @param {*} password
	 * @returns
	 */
	login(identifier, password) {
		return this.request("api/auth/local", "POST", {
			identifier,
			password,
		}).then((response) => {
			this.token = response.data.jwt;
			return response.data;
		});
	}
};
