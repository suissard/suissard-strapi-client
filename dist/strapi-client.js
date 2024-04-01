'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var qs = require('qs');
var axios = require('axios');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

const STORAGE_KEY = "strapi.auth.token";
const AuthUrl = {
  signIn: "/auth/local",
  signUp: "/auth/local/register",
  getMe: "/users/me"
};
const EndPoint = {
  auth: AuthUrl
};

function polyfillGlobalThis() {
  if (typeof globalThis === "object")
    return;
  try {
    Object.defineProperty(Object.prototype, "__magic__", {
      get: function() {
        return this;
      },
      configurable: true
    });
    __magic__.globalThis = __magic__;
    delete Object.prototype.__magic__;
  } catch (e) {
    if (typeof self !== "undefined") {
      self.globalThis = self;
    }
  }
}

function generateQueryString(obj) {
  return qs.stringify(obj, { encodeValuesOnly: true });
}
function generateQueryFromRawString(rawQuery) {
  return qs.stringify(qs.parse(rawQuery), { encodeValuesOnly: true });
}
const isBrowser = () => typeof window !== "undefined";
const stringToArray = (value) => {
  return value.split(".");
};

class StrapiClientHelper {
  url;
  constructor(url) {
    this.url = url;
  }
  _normalizeData(data) {
    const isObject = (data2) => Object.prototype.toString.call(data2) === "[object Object]";
    const flatten = (data2) => {
      if (!data2.attributes)
        return data2;
      return {
        id: data2.id,
        ...data2.attributes
      };
    };
    if (Array.isArray(data)) {
      return data.map((item) => this._normalizeData(item));
    }
    if (isObject(data)) {
      if (Array.isArray(data.data)) {
        data = [...data.data];
      } else if (isObject(data.data)) {
        data = flatten({ ...data.data });
      } else if (data.data === null) {
        data = null;
      } else {
        data = flatten(data);
      }
      for (const key in data) {
        data[key] = this._normalizeData(data[key]);
      }
      return data;
    }
    return data;
  }
  _returnDataHandler(data) {
    const response = {
      data: this._normalizeData(data.data),
      meta: data.meta,
      error: data.error
    };
    return response;
  }
  _returnErrorHandler(err) {
    let error = {
      status: null,
      message: null,
      details: null,
      name: null
    };
    if (err.code === "ENOTFOUND" || err.syscall === "getaddrinfo") {
      error.status = err.code;
      error.message = `The given url ${err.config.baseURL} is incorrect or invalid `;
      error.name = err.syscall;
    } else {
      if (!err.response.data.error) {
        error.status = err.response.status;
        error.message = err.response.statusText;
        error.name = err.response.data;
      } else {
        error = err.response.data.error;
      }
    }
    const response = {
      data: null,
      error
    };
    return response;
  }
  _generateFilter({ field, operator, value }) {
    let rawQuery = "";
    if (Array.isArray(value)) {
      value.map((val) => {
        rawQuery += `&filters[${field}][$${operator}]=${val}`;
      });
    } else {
      rawQuery += `&filters[${field}][$${operator}]=${value}`;
    }
    const parsedQuery = qs.parse(rawQuery);
    return this._handleUrl(generateQueryString(parsedQuery));
  }
  _genrateRelationsFilter(deepFilter) {
    let rawQuery = `filters`;
    const { path: fields, operator, value } = deepFilter;
    if (Array.isArray(fields)) {
      fields.map((field) => {
        rawQuery += `[${field}]`;
      });
    }
    const partialQuery = rawQuery;
    if (Array.isArray(value)) {
      value.map((val, index) => {
        if (index === 0) {
          rawQuery += `[$${operator}]=${val}`;
        } else {
          rawQuery += `&${partialQuery}[$${operator}]=${val}`;
        }
      });
    } else {
      rawQuery += `[$${operator}]=${value}`;
    }
    const parsedQuery = qs.parse(rawQuery);
    return this._handleUrl(generateQueryString(parsedQuery));
  }
  _generateSort(_sort) {
    const sort = [];
    _sort.map((item) => {
      if (item.order) {
        sort.push(`${item.field}:${item.order}`);
      } else {
        sort.push(`${item.field}`);
      }
    });
    return this._handleUrl(generateQueryString({ sort }));
  }
  _handleUrl(query) {
    const lastChar = this.url.charAt(this.url.length - 1);
    const hasQuerySymbol = this.url.includes("?");
    if (!hasQuerySymbol && lastChar !== "&") {
      return `${this.url}?${query}`;
    } else {
      return `${this.url}&${query}`;
    }
  }
  _generatePopulateDeep(options) {
    let url_string = "";
    options.map((q) => {
      const manipulatedPath = stringToArray(q.path);
      let partialQuery = "";
      if (Array.isArray(manipulatedPath)) {
        manipulatedPath.map((path, i) => {
          partialQuery += i === 0 ? `populate[${path}]` : `[populate][${path}]`;
        });
      }
      if (q.fields) {
        q.fields.map((field, i) => {
          url_string += i === 0 && url_string === "" ? `${partialQuery}[fields][${i}]=${field}` : `&${partialQuery}[fields][${i}]=${field}`;
        });
      }
      if (q.children === "*") {
        url_string += `&${partialQuery}[populate]=%2A`;
      }
      if (q.children && q.children !== "*") {
        const partialQuery2 = partialQuery;
        let someQuery = "";
        q.children.map((child) => {
          if (!child.fields) {
            url_string += `&${partialQuery2}[populate][${child.key}]=%2A`;
          } else {
            child.fields.map((field, ind) => {
              someQuery += `&${partialQuery2}[populate][${child.key}][fields][${ind}]=${field}`;
            });
          }
          url_string += `${someQuery}`;
        });
      }
    });
    return this._handleUrl(qs.stringify(qs.parse(url_string)));
  }
}

polyfillGlobalThis();
const DEFAULT_OPTIONS = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true
};
class StrapiAuthClient extends StrapiClientHelper {
  httpClient;
  localStorage;
  autoRefreshToken;
  persistSession;
  currentUser;
  currentSession;
  constructor(axiosInstance, options) {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    super(settings.url);
    this.httpClient = axiosInstance;
    this.currentUser = null;
    this.currentSession = null;
    this.autoRefreshToken = settings.autoRefreshToken;
    this.persistSession = settings.persistSession;
    this.localStorage = settings.localStorage || globalThis.localStorage;
  }
  signIn(credentials) {
    return new Promise((resolve) => {
      this.httpClient.post(EndPoint.auth.signIn, {
        identifier: credentials.email,
        password: credentials.password
      }).then((res) => {
        this._saveSession({
          access_token: res.data.jwt,
          user: res.data.user
        });
        resolve({
          data: res.data
        });
      }).catch((err) => {
        if (err) {
          return resolve(this._returnErrorHandler(err));
        }
      });
    });
  }
  async signUp(credentials) {
    return new Promise((resolve) => {
      this.httpClient.post(EndPoint.auth.signUp, credentials).then((res) => {
        resolve({ data: res.data });
        this._saveSession({
          access_token: res.data.jwt,
          user: res.data.user
        });
      }).catch((err) => {
        if (err) {
          if (err) {
            return resolve(this._returnErrorHandler(err));
          }
        }
      });
    });
  }
  async getMe() {
    return new Promise((resolve) => {
      this.httpClient.get(EndPoint.auth.getMe).then((res) => {
        resolve({ data: res.data });
      }).catch((err) => {
        if (err) {
          const error = err.response.data.error;
          return resolve({
            data: null,
            error
          });
        }
      });
    });
  }
  async signOut() {
    this.currentSession?.access_token;
    this._removeSession();
    return { error: null };
  }
  _saveSession(session) {
    this.currentSession = session;
    this.currentUser = session.user;
    if (this.persistSession) {
      this._persistSession(this.currentSession);
    }
  }
  async _removeSession() {
    this.currentSession = null;
    this.currentUser = null;
    isBrowser() && await this.localStorage.removeItem(STORAGE_KEY);
  }
  _persistSession(currentSession) {
    const data = { currentSession, expiresAt: currentSession.expires_at };
    isBrowser() && this.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

const getAxiosInstance = (url, apiToken) => {
  const API = axios__default["default"].create();
  API.defaults.baseURL = url;
  const axiosConfig = (config) => {
    if (apiToken) {
      config.headers = {
        Authorization: `Bearer ${apiToken}`
      };
    }
    return config;
  };
  API.interceptors.request.use(axiosConfig);
  return API;
};

var PublicationState = /* @__PURE__ */ ((PublicationState2) => {
  PublicationState2["LIVE"] = "live";
  PublicationState2["PREVIEW"] = "preview";
  return PublicationState2;
})(PublicationState || {});

class StrapiFilterBuilder extends StrapiClientHelper {
  constructor(url, axiosInstance, normalizeData, debug, isNotUserContent) {
    super(url);
    this.isNotUserContent = isNotUserContent;
    this.debug = debug;
    this.url = url;
    this.httpClient = axiosInstance;
    this.normalizeData = normalizeData;
  }
  httpClient;
  normalizeData;
  debug;
  async get() {
    if (this.debug) {
      console.log(this.url);
    }
    return new Promise((resolve) => {
      if (this.isNotUserContent) {
        this.httpClient.get(this.url).then((res) => {
          resolve(this.normalizeData ? this._returnDataHandler(res.data) : res.data);
        }).catch((err) => {
          if (err) {
            resolve(this._returnErrorHandler(err));
          }
        });
      }
      if (!this.isNotUserContent) {
        this.httpClient.get(this.url).then((res) => {
          resolve({ data: res.data, meta: void 0 });
        }).catch((err) => {
          if (err) {
            resolve(this._returnErrorHandler(err));
          }
        });
      }
    });
  }
  equalTo(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "eq",
      value
    });
    return this;
  }
  notEqualTo(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "ne",
      value
    });
    return this;
  }
  lessThan(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "lt",
      value
    });
    return this;
  }
  lessThanOrEqualTo(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "lte",
      value
    });
    return this;
  }
  greaterThan(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "gt",
      value
    });
    return this;
  }
  greaterThanOrEqualTo(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "gte",
      value
    });
    return this;
  }
  containsCaseSensitive(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "contains",
      value
    });
    return this;
  }
  notContainsCaseSensitive(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "notContains",
      value
    });
    return this;
  }
  contains(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "containsi",
      value
    });
    return this;
  }
  notContains(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "notContainsi",
      value
    });
    return this;
  }
  isNull(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "null",
      value
    });
    return this;
  }
  isNotNull(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "notNull",
      value
    });
    return this;
  }
  between(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "between",
      value
    });
    return this;
  }
  startsWith(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "startsWith",
      value
    });
    return this;
  }
  endsWith(field, value) {
    this.url = this._generateFilter({
      field,
      operator: "endsWith",
      value
    });
    return this;
  }
  filterDeep(path, operator, value) {
    this.url = this._genrateRelationsFilter({ path: stringToArray(path), operator, value });
    return this;
  }
  sortBy(sort) {
    this.url = this._generateSort(sort);
    return this;
  }
  paginate(page, pageSize) {
    const paginateRawQuery = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    this.url = this._handleUrl(generateQueryFromRawString(paginateRawQuery));
    return this;
  }
  paginateByOffset(start, limit) {
    const paginateRawQuery = `pagination[start]=${start}&pagination[limit]=${limit}`;
    this.url = this._handleUrl(generateQueryFromRawString(paginateRawQuery));
    return this;
  }
  withDraft() {
    this.url = this._handleUrl(`publicationState=${PublicationState.PREVIEW}`);
    return this;
  }
  onlyDraft() {
    this.url = this._handleUrl(`publicationState=${PublicationState.PREVIEW}&filters[publishedAt][$null]=true`);
    return this;
  }
  setLocale(localeCode) {
    this.url = this._handleUrl(`locale=${localeCode}`);
    return this;
  }
  populate() {
    const obj = {
      populate: "*"
    };
    this.url = this._handleUrl(generateQueryString(obj));
    return this;
  }
  populateWith(relation, selectFields, level2) {
    const obj = {
      populate: {
        [relation]: {
          fields: selectFields,
          populate: level2 ? "*" : null
        }
      }
    };
    this.url = this._handleUrl(generateQueryString(obj));
    return this;
  }
  populateDeep(populateDeepValues) {
    this.url = this._generatePopulateDeep(populateDeepValues);
    return this;
  }
}

class StrapiQueryBuilder extends StrapiClientHelper {
  httpClient;
  isNotUserContent;
  normalizData;
  debug;
  constructor(url, axiosInstance, isNotUserContent, normalizeData, debug) {
    super(url);
    this.debug = debug;
    this.normalizData = normalizeData;
    this.url = `${url}`;
    this.isNotUserContent = isNotUserContent;
    this.httpClient = axiosInstance;
  }
  select(fields) {
    if (fields) {
      const query = {
        fields
      };
      const queryString = generateQueryString(query);
      this.url = `${this.url}?${queryString}`;
    }
    return new StrapiFilterBuilder(this.url, this.httpClient, this.normalizData, this.debug, this.isNotUserContent);
  }
  selectManyByID(ids) {
    if (ids) {
      const query = ids?.map((item) => `filters[id][$in]=${item}`).join("&");
      this.url = `${this.url}?${query}`;
    }
    return new StrapiFilterBuilder(this.url, this.httpClient, this.normalizData, this.debug, this.isNotUserContent);
  }
  async create(values) {
    return new Promise((resolve) => {
      this.httpClient.post(this.url, this._handleValues(values)).then((res) => {
        resolve(this.normalizData ? this._returnDataHandler(res.data) : res.data);
      }).catch((err) => {
        if (err) {
          resolve(this._returnErrorHandler(err));
        }
      });
    });
  }
  async createMany(values) {
    await Promise.all(values.map(async (value) => {
      const { data } = await this.httpClient.post(this.url, this._handleValues(value));
      return Promise.resolve(data);
    })).catch((error) => {
      if (error) {
        this._returnErrorHandler(error);
      }
    });
    return Promise.resolve({
      success: true
    });
  }
  async update(id, values) {
    const url = `${this.url}/${id}`;
    return new Promise((resolve) => {
      this.httpClient.put(url, this._handleValues(values)).then((res) => {
        resolve(this.normalizData ? this._returnDataHandler(res.data) : res.data);
      }).catch((err) => {
        if (err) {
          resolve(this._returnErrorHandler(err));
        }
      });
    });
  }
  async updateMany(values) {
    await Promise.all(values.map(async (value) => {
      const url = `${this.url}/${value.id}`;
      const { data } = await this.httpClient.put(url, this._handleValues(value.variables));
      return Promise.resolve(data);
    })).catch((error) => {
      if (error) {
        this._returnErrorHandler(error);
      }
    });
    return Promise.resolve({
      success: true
    });
  }
  async deleteOne(id) {
    const url = `${this.url}/${id}`;
    return new Promise((resolve) => {
      this.httpClient.delete(url).then((res) => {
        resolve(res.data);
      }).catch((err) => {
        if (err) {
          resolve(this._returnErrorHandler(err));
        }
      });
    });
  }
  async deleteMany(ids) {
    await Promise.all(ids.map(async (id) => {
      const { data } = await this.httpClient.delete(`${this.url}/${id}`);
      return data;
    })).catch((err) => {
      if (err) {
        return this._returnErrorHandler(err);
      }
    });
    return Promise.resolve({
      success: true
    });
  }
  _handleValues(values) {
    if (this.isNotUserContent) {
      const dataValues = {
        data: values
      };
      return dataValues;
    } else {
      return values;
    }
  }
}

class StrapiClient {
  httpClient;
  options;
  isNotUserContent;
  normalizeData;
  debug;
  constructor(options) {
    this.debug = options.debug || false;
    this.httpClient = getAxiosInstance(options.url, options.apiToken);
    this.auth = this._initStrapiAuthClient(this.httpClient);
    this.normalizeData = options.normalizeData ? options.normalizeData : false;
    this.options = options;
    this.isNotUserContent = true;
  }
  auth;
  from(contentName) {
    contentName === "users" ? this.isNotUserContent = false : this.isNotUserContent = true;
    const url = `${this.options.url}/${contentName}`;
    return new StrapiQueryBuilder(url, this.httpClient, this.isNotUserContent, this.normalizeData, this.debug);
  }
  getApiUrl() {
    return this.options.url;
  }
  setToken(token) {
    this.httpClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  removeToken() {
    delete this.httpClient.defaults.headers.common["Authorization"];
  }
  _initStrapiAuthClient(axiosInstance) {
    return new StrapiAuthClient(axiosInstance, this.options);
  }
}

const defaultOptions = {
  url: "",
  normalizeData: true
};
const createClient = (options) => {
  return new StrapiClient({ ...defaultOptions, ...options });
};

exports.StrapiClient = StrapiClient;
exports.createClient = createClient;
//# sourceMappingURL=strapi-client.js.map
