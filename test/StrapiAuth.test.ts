import { describe, test, expect } from "vitest";
import StrapiApi from '../src/StrapiApi';
import { baseURL, collections, token, prefix } from "./config";

describe("Authentication", () => {
    const strapi = new StrapiApi({ baseURL, collections, token, prefix });

    // TODO: Implement proper registration test with a new user
    // This test is currently a placeholder because it requires valid user credentials.
    test.skip("register", async () => {
        // const newUser = await strapi.register('testuser', 'test@example.com', 'password');
        // expect(newUser).toBeDefined();
        // expect(newUser.user.username).toBe('testuser');
        expect(true).toBeTruthy();
    });

    // TODO: Implement proper login test with an existing user
    // This test is currently a placeholder because it requires valid user credentials.
    test.skip("login", async () => {
        // const user = await strapi.login('test@example.com', 'password');
        // expect(user).toBeDefined();
        // expect(strapi.token).toBeDefined();
        expect(true).toBeTruthy();
    });
});
