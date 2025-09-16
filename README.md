# Strapi API JS

A simple JavaScript library for interacting with the Strapi API.

## Installation

```bash
npm install strapi-api-js
```

## Usage

### Instantiation

First, you need to instantiate the `StrapiApi` client with your Strapi base URL, the collections you want to access, and your API token.

```javascript
import StrapiApi from 'strapi-api-js';

const baseURL = 'http://localhost:1337';
const collections = ['posts', 'authors'];
const token = 'your-api-token';

const strapi = new StrapiApi(baseURL, collections, token);
```

### CRUD Operations

You can perform CRUD (Create, Read, Update, Delete) operations on your collections.

#### List entries

```javascript
const posts = await strapi.collections.posts.list();
```

#### Get a specific entry

```javascript
const post = await strapi.collections.posts.get(1);
```

#### Create an entry

```javascript
const newPost = await strapi.collections.posts.create({
  title: 'My new post',
  content: 'This is the content of my new post.',
});
```

#### Update an entry

```javascript
const updatedPost = await strapi.collections.posts.update(1, {
  title: 'My updated post',
});
```

#### Delete an entry

```javascript
await strapi.collections.posts.delete(1);
```

### Authentication

The library also provides methods for user authentication.

#### Register a new user

```javascript
const newUser = await strapi.register('username', 'email@example.com', 'password');
```

#### Log in

```javascript
const user = await strapi.login('email@example.com', 'password');
// The API token will be automatically set for subsequent requests.
```
