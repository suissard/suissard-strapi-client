# Strapi API Client for JavaScript

A simple and lightweight JavaScript client for the Strapi REST API. This client helps you interact with your Strapi backend, handling authentication, collections, and content management.

## Features

- **Authentication**: Easy-to-use methods for user registration, login, and password management.
- **CRUD Operations**: Simple interface for creating, reading, updating, and deleting content.
- **Collection Management**: Automatically fetches and sets up your Strapi collections.
- **Promise-based**: All API calls return Promises for easy use with async/await.
- **Built-in Caching**: Caches GET requests to reduce redundant API calls.

## Installation

You can install the client using npm or yarn:

```bash
npm install axios qs
```

> This library is not on npm yet. You need to include the files in your project manually for now. You also need to install the peer dependencies `axios` and `qs`.

## Usage

First, you need to create an instance of the `StrapiApi` client.

```javascript
const StrapiApi = require('./src/StrapiApi'); // Adjust the path to the file

const strapi = new StrapiApi('http://localhost:1337');

// You can also specify collections, an auth token, and a different API prefix
// const strapi = new StrapiApi('http://localhost:1337', ['articles', 'categories'], 'your-jwt-token', 'api');
```

Once the client is initialized, it will automatically fetch the available collections from your Strapi instance. You can access them as properties on the `strapi.collections` object.

### Authentication

The client provides several methods for handling user authentication.

#### Register a new user

```javascript
async function registerUser() {
  try {
    const user = await strapi.register('my-username', 'user@example.com', 'password123');
    console.log('Registered user:', user);
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

#### Log in a user

```javascript
async function loginUser() {
  try {
    const { user, jwt } = await strapi.login('user@example.com', 'password123');
    console.log('Logged in user:', user);
    console.log('JWT:', jwt);
    // The client automatically stores the JWT for subsequent requests.
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

#### Get the current user

If a user is logged in, you can retrieve their information.

```javascript
async function getCurrentUser() {
  try {
    const user = await strapi.getMe();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Failed to get user:', error);
  }
}
```

#### Password Reset

```javascript
// Request a password reset email
await strapi.forgotPassword('user@example.com');

// Reset the password using the code from the email
await strapi.resetPassword('reset-code', 'new-password', 'new-password');
```

#### Sign Out

To sign out, simply call the `signOut` method. This will clear the token from the client instance.

```javascript
strapi.signOut();
```

### Working with Collections

Once the `strapi` object is initialized, you can access your collections through `strapi.collections`. For example, if you have a collection named `articles`, you can access it at `strapi.collections.articles`.

#### Get a list of entries

```javascript
async function getArticles() {
  try {
    const articles = await strapi.collections.articles.list();
    console.log('Articles:', articles);
  } catch (error) {
    console.error('Failed to get articles:', error);
  }
}
```

You can also filter, sort, and populate the results.

```javascript
// Get all articles, populate the 'author' and 'category' fields
const articles = await strapi.collections.articles.list(
  { title: { $eq: 'Hello World' } }, // filters
  ['title', 'content'], // fields
  ['author', 'category'] // populate
);
```

#### Get a single entry

```javascript
async function getArticle(id) {
  try {
    const article = await strapi.collections.articles.get(id);
    console.log('Article:', article);
  } catch (error) {
    console.error('Failed to get article:', error);
  }
}
```

#### Create an entry

```javascript
async function createArticle() {
  try {
    const newArticle = await strapi.collections.articles.create({
      title: 'My New Article',
      content: 'This is the content of the article.',
    });
    console.log('Created article:', newArticle);
  } catch (error) {
    console.error('Failed to create article:', error);
  }
}
```

#### Update an entry

```javascript
async function updateArticle(id) {
  try {
    const updatedArticle = await strapi.collections.articles.update(id, {
      title: 'My Updated Article Title',
    });
    console.log('Updated article:', updatedArticle);
  } catch (error) {
    console.error('Failed to update article:', error);
  }
}
```

#### Delete an entry

```javascript
async function deleteArticle(id) {
  try {
    await strapi.collections.articles.delete(id);
    console.log('Article deleted successfully.');
  } catch (error) {
    console.error('Failed to delete article:', error);
  }
}
```
