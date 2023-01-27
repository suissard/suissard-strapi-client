import { test, expect } from "vitest";

import StrapiApi from '../src/StrapiApi.js'
// import StrapiCollections from '../src/StrapiCollections.js'
// import StrapiObject from '../src/StrapiObject.js'

// Config de strapi
const baseURL = "https://admin.misssvt.fr";
const collections = ["botsdatas", "teams", "sharechannels", "emotemessages"];
const token =
	"5aa2793b442e3f7ed3398707c4e3c0c44c9ad34c55bd2ff320ab00d4e7e724106ed79e3e7be241f6a2ca1cd8109e217533656be59f249fd49a28045bdf361bd9a34f0219e429f21247de87404ed1604a85883987fc06666c1ab5ba706825bfb08bc9c5960ba972b6fdce6e6c72349d4e137b9c2cda09dcd048c0c32dc7116249";
const prefix = "api";

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
	// expect(strapi.collections[collections[0]]).toBeInstanceOf(StrapiCollections);
});

test("getHeader", () => {
	expect(strapi.getHeader()).toBeInstanceOf(Object);
	expect(strapi.getHeader()).toHaveProperty("Authorization", "Bearer " + token);
});

test("requests post, get, update, delete", async () => {
	const createObjectData = function(object, prefix="created"){
		if (!object) return {}
		let newObject = JSON.parse(JSON.stringify(object))
		for (let prop in newObject){
			let entrie = newObject[prop]
			if (typeof entrie == 'number') newObject[prop] = 9999 
			else if (typeof entrie == 'string') newObject[prop] = `${prefix}${prop}` 
			else if (typeof entrie == 'array') newObject[prop] = [`${prefix}${prop}`] 
			else if (typeof entrie == 'object') newObject[prop] = {[prefix+prop]: `${prefix}${prop}`} 
		}
		return newObject
	}
	
	//GET
	const collection = strapi.collections[collections[0]];	

	const configObject = {
		token: "token",
		name: "test à supprimer",
		ownerId: 123456789,
		admin: ["admin1", "admin2"],
		active: false,
	};

	
	const modifiedName = "test à modifier";
	const modifiedToken = "test à modifier";

	//compareEntries
	const object1 = { test1: 'test1', test2: 'test2' }
	const entries = { test2: 'test2' }
	expect(collection.compareEntries(object1, entries)).toBeTruthy()
	expect(collection.compareEntries(object1, { test2: 'test3' })).toBeFalsy()
	expect(collection.compareEntries(object1, { test3: 'test3' })).toBeFalsy()


	// Creer un objet	
	const createdObject = await collection.create(configObject);
	expect(createdObject.name).toBe(configObject.name);

	// Recuperer une liste d'objets
	const collectionList = await collection.list()
	expect(collectionList).toBeInstanceOf(Array);
	// expect(collectionList[0]).toBeInstanceOf(StrapiObject);

	const createdObjectFromList = collectionList.find((element)=>element.name == configObject.name);
	expect(createdObjectFromList.token).toBe(configObject.token);
	expect(createdObjectFromList.name).toBe(configObject.name);
	expect(createdObjectFromList.ownerId).toBe(String(configObject.ownerId));
	expect(createdObjectFromList.admin[0]).toBe(configObject.admin[0]);
	expect(createdObjectFromList.active).toBe(configObject.active);


	// Recuperer un objet spécifique
	const specificObject = await collection.get(createdObjectFromList.getID());
	expect(specificObject.token).toBe(configObject.token);
	expect(specificObject.name).toBe(configObject.name);
	expect(specificObject.ownerId).toBe(String(configObject.ownerId));
	expect(specificObject.admin[0]).toBe(configObject.admin[0]);
	expect(specificObject.active).toBe(configObject.active);


	// Modifier un objet
	let updatedObject = await collection.update(createdObjectFromList.getID(), {name: modifiedName, token: modifiedToken})
	expect(updatedObject.name).toBe(modifiedName);
	expect(updatedObject.token).toBe(modifiedToken);

	const modifiedObject = await collection.get(createdObjectFromList.getID(), undefined, true);
	expect(modifiedObject.name).toBe(modifiedName);
	expect(modifiedObject.token).toBe(modifiedToken);


	// Supprimer un objet
	await collection.delete(modifiedObject.getID());
	const collectionListWithoutcreatedObjectFromList = await collection.list(undefined, undefined, undefined, true)
	expect(collectionListWithoutcreatedObjectFromList.find((element)=>element.getID() == modifiedObject.getID())).toBeFalsy();
}, 10000);

test("GetAllData", async ()=>{
	const allData = await strapi.getAllData();
	expect(allData).toBeInstanceOf(Object);
	expect(allData).toSatisfy((coll) => {
		return Object.keys(coll).join(",") == collections.join(",");
	});
	// expect(allData[collections[0]][0]).toBeInstanceOf(StrapiObject);
},15000)


// TODO protocole de test
test("register", async ()=>{
	expect(true).toBeTruthy()
})

test("login", async ()=>{
	expect(true).toBeTruthy()
})

test("StrapiObject", async ()=>{
	expect(true).toBeTruthy()
})