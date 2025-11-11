import { describe, test, expect, beforeEach } from "vitest";
import StrapiApi from '../src/StrapiApi';
import { baseURL, collections, token, prefix } from "./config";
import axios, { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";

describe("StrapiApi", () => {
    let mock: MockAdapter;
    let strapi: StrapiApi;
    let axiosInstance: AxiosInstance;

    beforeEach(() => {
        axiosInstance = axios.create({ baseURL });
        mock = new MockAdapter(axiosInstance);
        strapi = new StrapiApi({ baseURL, collections, token, prefix }, axiosInstance);
    });

    test("get method", async () => {
        const url = "test";
        const mockData = { id: 1, name: "Test" };
        mock.onGet(`${prefix}/${url}`).reply(200, mockData);

        const result = await strapi.get(url);
        expect(result).toEqual(mockData);
    }, 5000); // 5 second timeout
});
