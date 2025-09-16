import { describe, test, expect } from "vitest";
import StrapiApi from '../src/StrapiApi.js';
import { baseURL, collections, token, prefix } from "./config.js";

describe("StrapiApi", () => {
    const strapi = new StrapiApi(baseURL, collections, token, prefix);

    test("Instanciation", () => {
        expect(strapi.baseURL).toBe(baseURL);
        expect(strapi.token).toBe(token);
        expect(strapi.prefix).toBe(prefix + "/");
    });

    test("setCollections", () => {
        expect(strapi.collections).toSatisfy((coll) => {
            return Object.keys(coll).join(",") == collections.join(",");
        });
    });

    test("getHeader", () => {
        expect(strapi.getHeader()).toBeInstanceOf(Object);
        expect(strapi.getHeader()).toHaveProperty("Authorization", "Bearer " + token);
    });

    test("GetAllData", async () => {
        const allData = await strapi.getAllData();
        expect(allData).toBeInstanceOf(Object);
        expect(allData).toSatisfy((coll) => {
            return Object.keys(coll).join(",") == collections.join(",");
        });
    }, 15000);
});
