import { describe, test, expect } from "vitest";
import StrapiApi from '../src/StrapiApi.js';
import { baseURL, collections, token, prefix } from "./config.js";

describe("StrapiCollections", () => {
    const strapi = new StrapiApi(baseURL, collections, token, prefix);
    const collection = strapi.collections[collections[0]];

    const testObject = {
        name: "test-object",
        ownerId: "123456789",
        admin: ["admin1", "admin2"],
        active: false,
    };
    let createdObject;

    test("compareEntries", () => {
        const object1 = { test1: 'test1', test2: 'test2' };
        const entries = { test2: 'test2' };
        expect(collection.compareEntries(object1, entries)).toBeTruthy();
        expect(collection.compareEntries(object1, { test2: 'test3' })).toBeFalsy();
        expect(collection.compareEntries(object1, { test3: 'test3' })).toBeFalsy();
    });

    test("create", async () => {
        createdObject = await collection.create(testObject);
        expect(createdObject.name).toBe(testObject.name);
        expect(createdObject.ownerId).toBe(testObject.ownerId);
        expect(createdObject.admin[0]).toBe(testObject.admin[0]);
        expect(createdObject.active).toBe(testObject.active);
    });

    test("list", async () => {
        const list = await collection.list();
        expect(list).toBeInstanceOf(Array);
        const found = list.find(item => item.getID() === createdObject.getID());
        expect(found).toBeDefined();
        expect(found.name).toBe(testObject.name);
    });

    test("get", async () => {
        const object = await collection.get(createdObject.getID());
        expect(object.name).toBe(testObject.name);
        expect(object.ownerId).toBe(testObject.ownerId);
        expect(object.admin[0]).toBe(testObject.admin[0]);
        expect(object.active).toBe(testObject.active);
    });

    test("update", async () => {
        const newName = "updated-name";
        const updatedObject = await collection.update(createdObject.getID(), { name: newName });
        expect(updatedObject.name).toBe(newName);
    });

    test("delete", async () => {
        const deletedObject = await collection.delete(createdObject.getID());
        expect(deletedObject).toBeDefined();
        const list = await collection.list(undefined, undefined, undefined, true);
        const found = list.find(item => item.getID() === createdObject.getID());
        expect(found).toBeUndefined();
    });
});
