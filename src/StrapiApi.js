const StrapiCollection = require("./StrapiCollections.js");
const axios = require("axios");

const qs = require("qs");

/**
 * @class StrapiApi
 * @description Classe pour interagir avec une API Strapi.
 */
module.exports = class StrapiApi {
	/**
	 * @constructor
	 * @param {string} baseURL - L'URL de base de l'API Strapi.
	 * @param {Array<string>} [collections=[]] - La liste des collections à gérer.
	 * @param {string} [token] - Le token d'authentification.
	 * @param {string} [prefix="api"] - Le préfixe de l'API.
	 */
	constructor(baseURL, collections = [], token, prefix = "api") {
		this.baseURL = baseURL;
		this.setCollection(collections);
		this.setToken(token);
		this.prefix = prefix + "/";

		this.axios = axios.create();
		this.logRequest = {};
	}

	/**
	 * Définit le token pour les requêtes.
	 * @param {string} token - Le token d'authentification.
	 * @returns {string} Le token défini.
	 */
	setToken(token) {
		this.token = token;
		return this.token;
	}

	/**
	 * Paramètre les collections auxquelles accéder.
	 * @param {Array<string>} [collections] - Si aucun tableau n'est fourni, tente de récupérer la liste des collections.
	 * @returns {Promise<Object>} Un objet contenant les collections initialisées.
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
	 * Renvoie une URL construite avec les options propres à Strapi.
	 * @param {string} subUrl - L'URL de la requête.
	 * @param {Object} [filters] - Les filtres de la requête.
	 * @param {Array<string>} [fields] - Les champs de la requête.
	 * @param {Array<string>|object} [populate] - Comment la requête doit être enrichie par d'autres sous-éléments.
	 * @returns {string} L'URL formatée.
	 */
	setUrl(subUrl, filters, fields, populate) {
		return `${subUrl.replace(/([a-z])([A-Z])/g, "$1-$2")}?${qs.stringify(
			{ filters, fields, populate },
			{ encodeValuesOnly: true }
		)}`;
	}

	/**
	 * Renvoie le header avec le token.
	 * @returns {Object} Le header d'authentification.
	 */
	getHeader() {
		if (this.token) return { Authorization: `Bearer ${this.token}` }
		else return {}
	}

	/**
	 * Fonction de requête multifonction avec stockage en cache des requêtes GET.
	 * @param {string} url - L'URL de la requête.
	 * @param {string} method - La méthode de la requête (GET, POST, PUT, DELETE).
	 * @param {Object} [data] - Les données de la requête.
	 * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	async request(url, method, data, force=true) {
		if (this.logRequest[method + url] && !force && method == "get")
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
	 * Requête de récupération de données (GET).
	 * @param {string} url - L'URL de la requête.
	 * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	async get(url, force) {
		return this.request(this.prefix + url, "get", undefined, force);
	}

	/**
	 * Requête d'envoi de données (POST).
	 * @param {string} url - L'URL de la requête.
	 * @param {Object} body - Le corps de la requête.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	async post(url, body) {
		return this.request(this.prefix + url, "post", { data: body });
	}

	/**
	 * Requête de mise à jour de données (PUT).
	 * @param {string} url - L'URL de la requête.
	 * @param {Object} body - Le corps de la requête.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	async put(url, body) {
		return this.request(this.prefix + url, "put", { data: body });
	}

	/**
	 * Requête de suppression de données (DELETE).
	 * @param {string} url - L'URL de la requête.
	 * @param {Object} [body] - Le corps de la requête.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	async delete(url, body) {
		return this.request(this.prefix + url, "delete", body);
	}

	/**
	 * Renvoie la liste des collections disponibles dans la base, sans les collections de base de Strapi.
	 * @returns {Promise<Array<string>>} Une promesse qui résout avec un tableau des noms de collections disponibles.
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
	 * Récupère la totalité des données dans les collections qui ont été définies.
	 * @returns {Promise<Object>} Une promesse qui résout avec un objet de la totalité des données.
	 */
	async getAllData() {
		let result = {};
		for (let i in this.collections) result[i] = await this.collections[i].list();
		return result;
	}

	/**
	 * Requête de registration d'un utilisateur.
	 * @param {string} username - Le nom d'utilisateur.
	 * @param {string} email - L'email de l'utilisateur.
	 * @param {string} password - Le mot de passe de l'utilisateur.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	register(username, email, password) {
		return this.post("auth/local/register", {
			username,
			email,
			password,
		});
	}

	/**
	 * Requête de login d'un utilisateur qui ajoute le token renvoyé.
	 * @param {string} identifier - L'identifiant de l'utilisateur (username ou email).
	 * @param {string} password - Le mot de passe de l'utilisateur.
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	login(identifier, password) {
		return this.request(this.prefix + "auth/local", "post", {
			identifier,
			password,
		}).then((response) => {
			if (response?.data?.jwt) {
				this.setToken(response.data.jwt);
			}
			return response?.data;
		});
	}

	/**
	 * Déconnecte l'utilisateur en supprimant le token
	 */
	signOut() {
		this.setToken(undefined);
	}

	/**
	 * Demande de réinitialisation du mot de passe
	 * @param {String} email
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	forgotPassword(email) {
		return this.post("auth/forgot-password", {
			email,
		});
	}

	/**
	 * Réinitialise le mot de passe de l'utilisateur
	 * @param {String} code
	 * @param {String} password
	 * @param {String} passwordConfirmation
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	resetPassword(code, password, passwordConfirmation) {
		return this.post("auth/reset-password", {
			code,
			password,
			passwordConfirmation,
		});
	}

	/**
	 * Récupère les informations de l'utilisateur actuellement authentifié
	 * @returns {Promise<Object>} La réponse de la requête.
	 */
	getMe() {
		return this.get("users/me");
	}
};
