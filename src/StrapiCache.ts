import { StrapiFindFunction } from "./types/StrapiCollections";

/**
 * @class StrapiCache
 * @description Classe de cache simple qui étend `Map` et ajoute une méthode `find`.
 * @extends Map
 */
export default class StrapiCache<T> extends Map<string, T> {
  /**
   * Trouve une valeur dans le cache en utilisant une fonction de test.
   * @param {function(value: *, id: *): boolean} func - La fonction de test.
   * @returns {*} La première valeur pour laquelle la fonction de test retourne `true`.
   */
  find(func: StrapiFindFunction<T>): T | undefined {
    for (const [id, value] of this) {
      if (func(value, id)) {
        return value;
      }
    }
    return undefined;
  }
}
