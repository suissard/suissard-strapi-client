import StrapiCollection from "./StrapiCollections";

/**
 * @class StrapiObject
 * @description Classe représentant un objet de la base de données Strapi.
 */
export default class StrapiObject<T> {
  private documentId: string;
  private type: string;
  private collection: StrapiCollection<T>;

  /**
   * @constructor
   * @param {string} documentId - L'ID de l'objet.
   * @param {string} type - Le type de l'objet (nom de la collection).
   * @param {Object} value - Les attributs de l'objet.
   * @param {StrapiCollection} collection - L'instance de la collection parente.
   */
  constructor(
    documentId: string,
    type: string,
    value: T,
    collection: StrapiCollection<T>
  ) {
    this.documentId = documentId;
    this.type = type;
    this.collection = collection;

    const processedValue = this.changeFromDB(value);
    Object.assign(this, processedValue);
  }

  getID(): string {
    return this.documentId;
  }

  getType(): string {
    return this.type;
  }

  getCollection(): StrapiCollection<T> {
    return this.collection;
  }

  /**
   * Met à jour l'objet avec de nouvelles données.
   * @param {Object} data - Les nouvelles données.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet mis à jour.
   */
  update(data: Partial<T>): Promise<StrapiObject<T> | undefined> {
    Object.assign(this, data);
    return this.getCollection().update(this.getID(), data);
  }

  /**
   * Supprime l'objet de la base de données.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet supprimé.
   */
  delete(): Promise<StrapiObject<T> | undefined> {
    return this.getCollection().delete(this.getID());
  }

  /**
   * Rafraîchit les données de l'objet depuis la base de données.
   * @returns {Promise<StrapiObject>} Une promesse qui résout avec l'objet rafraîchi.
   */
  refresh(): Promise<StrapiObject<T>> {
    return this.getCollection().get(this.getID(), "*", true);
  }

  /**
   * Convertit les données de la base de données (décode les URI).
   * @param {Object} [value=this] - L'objet à convertir.
   * @returns {Object} L'objet converti.
   * @private
   */
  private changeFromDB(value: T): T {
    const decodeURIObject = (obj: any): any => {
      let target: any = {};
      if (obj instanceof Array) {
        target = [];
      }
      for (const i in obj) {
        const indexTarget = typeof i === "string" ? decodeURIComponent(i) : i;
        if (obj[i] instanceof Object) {
          target[indexTarget] = decodeURIObject(obj[i]);
        } else if (typeof obj[i] === "string") {
          target[indexTarget] = decodeURIComponent(obj[i]);
        } else {
          target[indexTarget] = obj[i];
        }
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
  private changeToDB(value: T): T {
    const encodeURIObject = (obj: any): any => {
      let target: any = {};
      if (obj instanceof Array) {
        target = [];
      }
      for (const i in obj) {
        const indexTarget = typeof i === "string" ? encodeURIComponent(i) : i;
        if (obj[i] instanceof Object) {
          target[indexTarget] = encodeURIObject(obj[i]);
        } else if (typeof obj[i] === "string") {
          target[indexTarget] = encodeURIComponent(obj[i]);
        } else {
          target[indexTarget] = obj[i];
        }
      }
      return target;
    };

    return encodeURIObject(value || this);
  }
}
