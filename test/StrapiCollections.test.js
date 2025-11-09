import { describe, test, expect } from "vitest";
import StrapiApi from '../src/StrapiApi.js';
import { baseURL, collections, token, prefix, testObject, updateEntrie } from "./config.js";

describe("StrapiCollections", () => {
    const strapi = new StrapiApi(baseURL, collections, token, prefix);
    const collection = strapi.collections[collections[0]];

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
        await new Promise(resolve => setTimeout(resolve, 200));

        for (let key in testObject) {
            expect(createdObject[key]).toBe(testObject[key]);
        }
    });

    test("list", async () => {
        const list = await collection.list();        await new Promise(resolve => setTimeout(resolve, 200));


        expect(list).toBeInstanceOf(Array);
        const found = list.find(item => item.getID() === createdObject.getID());
        expect(found).toBeDefined();
        for (let key in testObject) {
            expect(found[key]).toBe(testObject[key]);
        }
    });

    test("get", async () => {
        const object = await collection.get(createdObject.getID());
                await new Promise(resolve => setTimeout(resolve, 200));

        for (let key in testObject) {
            expect(object[key]).toBe(testObject[key]);
        }
    });

    test("update", async () => {
        const newName = updateEntrie[1];
        testObject[updateEntrie[0]] = newName;
        const updatedObject = await collection.update(createdObject.getID(), { [updateEntrie[0]]: newName });
                await new Promise(resolve => setTimeout(resolve, 200));

        for (let key in testObject) {
            expect(updatedObject[key]).toBe(testObject[key]);
        }
    });

    test("delete", async () => {
        const deletedObject = await collection.delete(createdObject.getID());
        await new Promise(resolve => setTimeout(resolve, 200));

        const list = await collection.list(undefined, undefined, undefined, true);
        const found = list.find(item => item.getID() === createdObject.getID());
        expect(found).toBeUndefined();
    });
});
