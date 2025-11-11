import StrapiCollection from "./StrapiCollections";
import axios, { AxiosInstance, Method } from "axios";
import qs from "qs";
import {
  StrapiApiOptions,
  StrapiCollections,
  StrapiLoginCredentials,
  StrapiRegisterCredentials,
  StrapiRequestOptions,
  StrapiForgotPassword,
  StrapiResetPassword
} from "./types/StrapiApi";

/**
 * @class StrapiApi
 * @description Classe pour interagir avec une API Strapi.
 */
export default class StrapiApi {
  baseURL: string;
  collections: StrapiCollections = {};
  token?: string;
  prefix: string;
  axios: AxiosInstance;
  logRequest: Record<string, any> = {};

  /**
   * @constructor
   * @param {StrapiApiOptions} options - The options for the Strapi API.
   * @param {AxiosInstance} [axiosInstance] - An optional axios instance.
   */
  constructor(options: StrapiApiOptions, axiosInstance?: AxiosInstance) {
    this.baseURL = options.baseURL;
    this.setCollection(options.collections);
    this.setToken(options.token);
    this.prefix = `${options.prefix ?? "api"}/`;
    this.axios = axiosInstance || axios.create({ baseURL: this.baseURL });
  }

  /**
   * Définit le token pour les requêtes.
   * @param {string} token - Le token d'authentification.
   * @returns {string} Le token défini.
   */
  setToken(token?: string): string | undefined {
    this.token = token;
    return this.token;
  }

  /**
   * Paramètre les collections auxquelles accéder.
   * @param {Array<string>} [collections] - Si aucun tableau n'est fourni, tente de récupérer la liste des collections.
   * @returns {Promise<Object>} Un objet contenant les collections initialisées.
   */
  async setCollection(collections?: string[]): Promise<StrapiCollections> {
    if (!collections) collections = await this.getAllCollectionsName();
    if (!collections) throw new Error("Impossible de recupérer les collections");
    this.collections = {};
    for (const collection of collections) {
      this.collections[collection] = new StrapiCollection<any>(collection, this);
    }
    return this.collections;
  }

  /**
   * Renvoie une URL construite avec les options propres à Strapi.
   * @param {string} subUrl - L'URL de la requête.
   * @param {StrapiRequestOptions} [options] - The options for the request.
   * @returns {string} L'URL formatée.
   */
  setUrl(subUrl: string, options: StrapiRequestOptions = {}): string {
    const { filters, fields, populate } = options;
    const queryString = qs.stringify({ filters, fields, populate }, { encodeValuesOnly: true });
    return `${subUrl.replace(/([a-z])([A-Z])/g, "$1-$2")}?${queryString}`;
  }

  /**
   * Renvoie le header avec le token.
   * @returns {Object} Le header d'authentification.
   */
  getHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  /**
   * Fonction de requête multifonction avec stockage en cache des requêtes GET.
   * @param {string} url - L'URL de la requête.
   * @param {string} method - La méthode de la requête (GET, POST, PUT, DELETE).
   * @param {Object} [data] - Les données de la requête.
   * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  async request<T>(
    url: string,
    method: Method,
    data?: any,
    force = true
  ): Promise<T> {
    const requestKey = `${method.toUpperCase()}${url}`;
    if (this.logRequest[requestKey] && !force && method.toLowerCase() === "get") {
      return this.logRequest[requestKey];
    }
    try {
      const result = await this.axios({
        url,
        method,
        data,
        headers: this.getHeader(),
      });
      this.logRequest[requestKey] = result;
      return result.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Requête de récupération de données (GET).
   * @param {string} url - L'URL de la requête.
   * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  async get<T>(url: string, force?: boolean): Promise<T> {
    return this.request<T>(`${this.prefix}${url}`, "get", undefined, force);
  }

  /**
   * Requête d'envoi de données (POST).
   * @param {string} url - L'URL de la requête.
   * @param {Object} data - Le corps de la requête.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  async post<T>(url: string, data: any): Promise<T> {
    return this.request<T>(`${this.prefix}${url}`, "post", { data });
  }

  /**
   * Requête de mise à jour de données (PUT).
   * @param {string} url - L'URL de la requête.
   * @param {Object} body - Le corps de la requête.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  async put<T>(url: string, body: any): Promise<T> {
    return this.request<T>(`${this.prefix}${url}`, "put", { data: body });
  }

  /**
   * Requête de suppression de données (DELETE).
   * @param {string} url - L'URL de la requête.
   * @param {Object} [body] - Le corps de la requête.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  async delete<T>(url: string, body?: any): Promise<T> {
    return this.request<T>(`${this.prefix}${url}`, "delete", body);
  }

  /**
   * Renvoie la liste des collections disponibles dans la base, sans les collections de base de Strapi.
   * @returns {Promise<Array<string>>} Une promesse qui résout avec un tableau des noms de collections disponibles.
   */
  async getAllCollectionsName(): Promise<string[]> {
    const notCollection = [
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
    const response = await this.request<any>(
      "content-type-builder/content-types",
      "get"
    );
    return response?.data
      .filter(
        (data: any) =>
          data.schema.kind === "collectionType" &&
          !notCollection.includes(data.schema.collectionName)
      )
      .map((data: any) => data.schema.collectionName);
  }

  /**
   * Récupère la totalité des données dans les collections qui ont été définies.
   * @returns {Promise<Object>} Une promesse qui résout avec un objet de la totalité des données.
   */
  async getAllData(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const i in this.collections) {
      result[i] = await this.collections[i].list();
    }
    return result;
  }

  /**
   * Requête de registration d'un utilisateur.
   * @param {StrapiRegisterCredentials} credentials - The user's credentials.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  register(credentials: StrapiRegisterCredentials): Promise<any> {
    return this.post("auth/local/register", credentials);
  }

  /**
   * Requête de login d'un utilisateur qui ajoute le token renvoyé.
   * @param {StrapiLoginCredentials} credentials - The user's credentials.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  async login(credentials: StrapiLoginCredentials): Promise<any> {
    const response = await this.request<any>(
      `${this.prefix}auth/local`,
      "post",
      credentials
    );
    if (response?.jwt) {
      this.setToken(response.jwt);
    }
    return response;
  }

  /**
   * Déconnecte l'utilisateur en supprimant le token
   */
  signOut(): void {
    this.setToken(undefined);
  }

  /**
   * Demande de réinitialisation du mot de passe
   * @param {StrapiForgotPassword} data - The user's email.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  forgotPassword(data: StrapiForgotPassword): Promise<any> {
    return this.post("auth/forgot-password", data);
  }

  /**
   * Réinitialise le mot de passe de l'utilisateur
   * @param {StrapiResetPassword} data - The user's new password and reset code.
   * @returns {Promise<Object>} La réponse de la requête.
   */
  resetPassword(data: StrapiResetPassword): Promise<any> {
    return this.post("auth/reset-password", data);
  }

  /**
   * Récupère les informations de l'utilisateur actuellement authentifié
   * @returns {Promise<Object>} La réponse de la requête.
   */
  getMe(): Promise<any> {
    return this.get("users/me");
  }
}
