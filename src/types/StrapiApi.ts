import StrapiCollection from "../StrapiCollections";

export interface StrapiApiOptions {
  baseURL: string;
  collections?: string[];
  token?: string;
  prefix?: string;
}

export interface StrapiRequestOptions {
  filters?: Record<string, any>;
  fields?: string[];
  populate?: string[] | Record<string, any>;
}

export interface StrapiLoginCredentials {
  identifier: string;
  password:  string;
}

export interface StrapiForgotPassword {
  email: string;
}

export interface StrapiResetPassword {
  code?: string;
  password?: string;
  passwordConfirmation?: string;
}

export interface StrapiRegisterCredentials extends StrapiLoginCredentials {
  username: string;
  email: string;
}

export type StrapiCollections = Record<string, StrapiCollection<any>>;
