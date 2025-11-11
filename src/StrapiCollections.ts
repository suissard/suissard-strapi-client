import StrapiObject from "./StrapiObject";
import StrapiCache from "./StrapiCache";
import StrapiApi from "./StrapiApi";
import {
  StrapiListRequest,
  StrapiListResponse,
} from "./types/StrapiCollections";
import { StrapiRequestOptions } from "./types/StrapiApi";

/**
 * @class StrapiCollection
 * @description Classe pour gérer les opérations sur une collection Strapi.
 */
export default class StrapiCollection<T> {
  api: StrapiApi;
  name: string;
  cache: StrapiCache<StrapiObject<T>>;

  /**
   * @constructor
   * @param {string} name - Le nom de la collection.
   * @param {StrapiApi} api - L'instance de la classe StrapiApi.
   */
  constructor(name: string, api: StrapiApi) {
    this.api = api;
    this.name = name;
    this.cache = new StrapiCache<StrapiObject<T>>();
  }

  /**
   * Récupère une liste d'éléments de la collection.
   * @see https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/rest/filtering-locale-publication.html#filtering
   * @param {StrapiListRequest<T>} [options] - The options for the request.
   * @returns {Promise<Array<StrapiObject>>} Une promesse qui résout avec un tableau d'objets Strapi.
   */
  async list(
    options: StrapiListRequest<T> = {}
  ): Promise<StrapiObject<T>[]> {
    const { filters, fields, populate = "*", force } = options;
    const url = this.api.setUrl(this.name, {
      filters,
      fields: fields as string[],
      populate: populate as string[] | Record<string, any>,
    });
    const response = await this.api.get<StrapiListResponse<T>>(
      `${url}&pagination[page]=1&pagination[pageSize]=100`,
      force
    );
    const result: StrapiObject<T>[] = [];

    const getListPage = (response: StrapiListResponse<T>) => {
      for (const item of response.data) {
        const obj = new StrapiObject<T>(
          (item as any).documentId,
          this.name,
          item,
          this
        );
        this.cache.set(obj.getID(), obj);
        result.push(obj);
      }
    };

    getListPage(response);

    for (let i = 1; i < response.meta.pagination.pageCount; i++) {
      const nextPage = await this.api.get<StrapiListResponse<T>>(
        `${url}&pagination[page]=${i + 1}&pagination[pageSize]=100`,
        force
      );
      getListPage(nextPage);
    }

    return result;
  }

  /**
   * Récupère un élément spécifique par son ID.
   * @param {string} documentId - L'ID de l'élément.
   * @param {Array<string>|string} [populate="*"] - Les relations à enrichir.
   * @param {boolean} [force=true] - Si true, force la requête sans tenir compte du cache.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet Strapi.
   */
  async get(
    documentId: string,
    populate: string | string[] = "*",
    force?: boolean
  ): Promise<StrapiObject<T>> {
    const url = this.api.setUrl(`${this.name}/${documentId}`, {
      populate: populate as string[] | Record<string, any>,
    });
    const response = await this.api.get<{ data: T }>(url, force);
    const obj = new StrapiObject<T>(
      documentId,
      this.name,
      response.data,
      this
    );
    this.cache.set(obj.getID(), obj);
    return obj;
  }

  /**
   * Crée un nouvel élément dans la collection.
   * @param {Object} body - Le corps de l'élément à créer.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec le nouvel objet Strapi.
   */
  async create(body: Partial<T>): Promise<StrapiObject<T> | undefined> {
    const url = this.api.setUrl(this.name);
    const response = await this.api.post<{ data: T }>(url, body);
    if (!response?.data) return;
    const obj = new StrapiObject<T>(
      (response.data as any).documentId,
      this.name,
      response.data,
      this
    );
    this.cache.set(obj.getID(), obj);
    return obj;
  }

  /**
   * Supprime un élément de la collection.
   * @param {string} id - L'ID de l'élément à supprimer.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet Strapi supprimé.
   */
  async delete(id: string): Promise<StrapiObject<T> | undefined> {
    const url = this.api.setUrl(`${this.name}/${id}`);
    await this.api.delete(url);
    const obj = this.cache.get(id);
    if (obj) {
      this.cache.delete(id);
    }
    return obj;
  }

  /**
   * Compare les entrées d'un objet avec un autre objet.
   * @param {Object} obj - L'objet à comparer.
   * @param {Object} entries - Les entrées à comparer.
   * @returns {boolean} `true` si les entrées sont identiques, sinon `false`.
   * @private
   */
  private compareEntries(obj: T, entries: Partial<T>): boolean {
    for (const key in entries) {
      if (obj[key as keyof T] !== entries[key as keyof T]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Met à jour un élément de la collection.
   * @param {string} documentId - L'ID de l'élément à mettre à jour.
   * @param {Object} body - Le corps de l'élément à mettre à jour.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet Strapi mis à jour.
   */
  async update(
    documentId: string,
    body: Partial<T>
  ): Promise<StrapiObject<T> | undefined> {
    const url = this.api.setUrl(`${this.name}/${documentId}`);
    const response = await this.api.put<{ data: T }>(url, body);
    if (!response?.data) return;
    let obj = this.cache.get(documentId);
    if (obj && !this.compareEntries(obj as any, body)) {
      obj.update(body);
    } else {
      obj = new StrapiObject<T>(
        (response.data as any).documentId,
        this.name,
        response.data,
        this
      );
      this.cache.set(obj.getID(), obj);
    }
    return obj;
  }
}
