import StrapiApi from './StrapiApi.js'
import StrapiCollection from './StrapiCollections.js'

let collections = ['users', 'articles', 'etiquettes', 'randomImg', 'categories']


const strapi = new StrapiApi()

for (let collection of collections)
  strapi[collection] = new StrapiCollection(
    collection,
    strapi
  )

