import { AxiosInstance } from 'axios';

interface StrapiApiError {
    message: string | null;
    status: number | null;
    name: string | null;
    details: any | null;
}
declare type StrapiClientOptions = {
    url: string;
    debug?: boolean;
    normalizeData?: boolean;
    apiToken?: string;
    headers?: {
        [key: string]: string;
    };
    persistSession?: boolean;
    localStorage?: SupportedStorage;
};
declare type StrapiPagination = {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
};
declare type Meta = {
    pagination: StrapiPagination;
};
declare type StrapiApiResponse<T> = {
    data: T | null;
    error?: StrapiApiError;
    meta?: Meta;
};
declare type StrapiUnifiedResponse<T> = {
    id: number | string;
    attributes: T;
};
declare type InferedTypeFromArray<T> = T extends Array<infer U> ? U : T;
declare type StrapiPopulatedResponse<T> = {
    data: T extends Array<infer U> ? Array<StrapiUnifiedResponse<U>> : StrapiUnifiedResponse<T>;
};
declare type StrapiTimestamp = {
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
};
declare type AnyFunction = (...args: any[]) => any;
declare type MaybePromisify<T> = T | Promise<T>;
declare type PromisifyMethods<T> = {
    [K in keyof T]: T[K] extends AnyFunction ? (...args: Parameters<T[K]>) => MaybePromisify<ReturnType<T[K]>> : T[K];
};
declare type SupportedStorage = PromisifyMethods<Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>>;

declare type SignInCredentials = {
    email: string;
    password: string;
};
declare type SignUpCredentials = {
    username: string;
    email: string;
    password: string;
};
declare type Provider = 'auth0' | 'cas' | 'cognito' | 'discord' | 'email' | 'facebook' | 'github' | 'google' | 'instagram' | 'linkedin' | 'microsoft' | 'reddit' | 'twitch' | 'twitter' | 'vk';
declare type User = {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
};
declare type AuthData = {
    jwt: 'string';
    user: User | null;
    provider?: Provider;
};
interface Session {
    access_token: string;
    user: User | null;
    /**
     * The number of seconds until the token expires (since it was issued). Returned when a login is confirmed.
     */
    expires_in?: number;
    /**
     * A timestamp of when the token will expire. Returned when a login is confirmed.
     */
    expires_at?: number;
    refresh_token?: string;
}

declare type CrudOperators = 'eq' | 'ne' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'notIn' | 'contains' | 'notContains' | 'containsi' | 'notContainsi' | 'between' | 'null' | 'notNull' | 'startsWith' | 'endsWith';
declare type RelationalFilterOperators = 'eq' | 'ne' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'notIn' | 'contains' | 'notContains' | 'startsWith' | 'endsWith';
declare type CrudFilter<T> = {
    field: keyof T;
    operator: CrudOperators;
    value: string | number | Array<string | number>;
};
declare type CrudSort<T = any> = {
    field: keyof T;
    order?: 'asc' | 'desc';
};
declare type DeepFilterType = {
    path: Array<string>;
    operator: RelationalFilterOperators;
    value: string | number | Array<string | number>;
};
declare type DeepChild = {
    key: string;
    fields?: string[];
};
declare type PopulateDeepOptions = {
    path: string;
    fields?: string[];
    children?: DeepChild[] | '*';
};
declare type CrudSorting<T = any> = CrudSort<T>[];

declare abstract class StrapiClientHelper<T> {
    protected url: string;
    constructor(url: string);
    private _normalizeData;
    protected _returnDataHandler(data: StrapiApiResponse<T>): StrapiApiResponse<T>;
    protected _returnErrorHandler(err: any): StrapiApiResponse<T>;
    protected _generateFilter({ field, operator, value }: CrudFilter<InferedTypeFromArray<T>>): string;
    protected _genrateRelationsFilter(deepFilter: DeepFilterType): string;
    protected _generateSort<T>(_sort: CrudSorting<T>): string;
    protected _handleUrl(query: string): string;
    protected _generatePopulateDeep(options: PopulateDeepOptions[]): string;
}

declare class StrapiAuthClient extends StrapiClientHelper<AuthData> {
    private httpClient;
    protected localStorage: SupportedStorage;
    protected autoRefreshToken: boolean;
    protected persistSession: boolean;
    /**
     * The currently logged in user or null.
     */
    protected currentUser: User | null;
    /**
     * The session object for the currently logged in user or null.
     */
    protected currentSession: Session | null;
    constructor(axiosInstance: AxiosInstance, options: StrapiClientOptions);
    /**
     *
     * @param credentials email and password
     * @returns data and error objects, data object contains jwt, user and provider
     */
    signIn(credentials: SignInCredentials): Promise<StrapiApiResponse<AuthData>>;
    /**
     *
     * @param credentials object contains username, email and password
     * @returns data and error objects, data object contains jwt, user and provider
     */
    signUp(credentials: SignUpCredentials): Promise<StrapiApiResponse<AuthData>>;
    /**
     *
     * @returns Get the user object by JWT token
     */
    getMe(): Promise<StrapiApiResponse<User>>;
    /**
     * Inside a browser context, `signOut()` will remove the logged in user from the browser session
     * and log them out - removing all items from localstorage and then trigger a "SIGNED_OUT" event.
     *
     * For server-side management, you can disable sessions by passing a JWT through to `auth.api.signOut(JWT: string)`
     */
    signOut(): Promise<{
        error: StrapiApiError | null;
    }>;
    /**
     * set currentSession and currentUser
     * process to _startAutoRefreshToken if possible
     */
    private _saveSession;
    private _removeSession;
    private _persistSession;
}

declare class StrapiFilterBuilder<T> extends StrapiClientHelper<T> {
    private isNotUserContent;
    private httpClient;
    private normalizeData;
    private debug;
    constructor(url: string, axiosInstance: AxiosInstance, normalizeData: boolean, debug: boolean, isNotUserContent: boolean);
    get(): Promise<StrapiApiResponse<T>>;
    equalTo(field: keyof InferedTypeFromArray<T>, value: string | number): this;
    notEqualTo(field: keyof InferedTypeFromArray<T>, value: string | number): this;
    lessThan(field: keyof InferedTypeFromArray<T>, value: string | number): this;
    lessThanOrEqualTo(field: keyof InferedTypeFromArray<T>, value: string | number): this;
    greaterThan(field: keyof InferedTypeFromArray<T>, value: string | number): this;
    greaterThanOrEqualTo(field: keyof InferedTypeFromArray<T>, value: string | number): this;
    containsCaseSensitive(field: keyof InferedTypeFromArray<T>, value: string): this;
    notContainsCaseSensitive(field: keyof InferedTypeFromArray<T>, value: string): this;
    contains(field: keyof InferedTypeFromArray<T>, value: string): this;
    notContains(field: keyof InferedTypeFromArray<T>, value: string): this;
    isNull(field: keyof InferedTypeFromArray<T>, value: string): this;
    isNotNull(field: keyof InferedTypeFromArray<T>, value: string): this;
    between(field: keyof InferedTypeFromArray<T>, value: Array<any>): this;
    startsWith(field: keyof InferedTypeFromArray<T>, value: string): this;
    endsWith(field: keyof InferedTypeFromArray<T>, value: string): this;
    /**
     *
     * @param path relation path as string type.  Ex - 'subcategories.products.slug'
     * @param operator "eq" | "ne" | "lt" | "gt" | "lte" | "gte" | "in" | "notIn" | "contains" | "notContains" | "startsWith" | "endsWith"
     * @param value values can be string, number or array
     * @returns
     */
    filterDeep(path: string, operator: RelationalFilterOperators, value: string | number | Array<string | number>): this;
    /**
     *
     * @param sort expects an array with the field and order example - [{ field: 'id', order: 'asc' }]
     *
     */
    sortBy(sort: CrudSorting<InferedTypeFromArray<T>>): this;
    /**
     *
     * @param page Page number
     * @param pageSize 	Page size
     * @returns Pagination by page
     */
    paginate(page: number, pageSize: number): this;
    /**
     *
     * @param start Start value (i.e. first entry to return)
     * @param limit Number of entries to return
     * @returns Pagination by offset
     */
    paginateByOffset(start: number, limit: number): this;
    /**
     *
     * @returns returns both draft entries & published entries
     */
    withDraft(): this;
    /**
     *
     * @returns retrieve only draft entries
     */
    onlyDraft(): this;
    /**
     *
     * @param localeCode expects string locale-code
     * @returns returns content only for a specified locale
     */
    setLocale(localeCode: string): this;
    /**
     *
     * @returns Populate 1 level for all relations
     */
    populate(): this;
    /**
     * @param key relation name
     * @param selectFields an Array of field names to populate
     * @param level2 expects boolean value to To populate second-level deep for all relations
     */
    populateWith<Q>(relation: T extends Array<infer U> ? keyof U : keyof T, selectFields?: Array<keyof Q>, level2?: boolean): this;
    /**
     *
     * @param populateDeepValues expects an array with the path, fields and children
     * @type path: string
     *
     * @type fields: Array of strings
     *
     * @type children : Array [key:string, fields:Array of strings]
    
     * @returns Populate n level for the specified relation
     */
    populateDeep(populateDeepValues: PopulateDeepOptions[]): this;
}

declare class StrapiQueryBuilder<T> extends StrapiClientHelper<T> {
    private httpClient;
    private isNotUserContent;
    protected normalizData: boolean;
    private debug;
    constructor(url: string, axiosInstance: AxiosInstance, isNotUserContent: boolean, normalizeData: boolean, debug: boolean);
    /**
     *
     * @param fields Array of string to select the fields.
     * @returns collection of requested contents.
     */
    select(fields?: Array<keyof T>): StrapiFilterBuilder<T[]>;
    /**
     *
     * @param ids Array of string or number values to select many records.
     * @returns selected contents.
     */
    selectManyByID(ids: string[] | number[]): StrapiFilterBuilder<T[]>;
    /**
     *
     * @param values The values to create a new record.
     * @returns By default the new record is returned.
     */
    create(values: T): Promise<StrapiApiResponse<T>>;
    /**
     *
     * @param values objects of values to create many records.
     * @returns return boolean value if the process on success
     */
    createMany(values: T[]): Promise<{
        success: true;
    }>;
    /**
     *
     * @param values The values to update an existing record.
     * @returns By default the new record is returned.
     */
    update(id: string | number, values: Partial<T>): Promise<StrapiApiResponse<T>>;
    /**
     *
     * @param values objects of values to update many records.
     * @returns return boolean value if the process on success
     */
    updateMany(values: {
        id: string | number;
        variables: Partial<T>;
    }[]): Promise<{
        success: true;
    }>;
    /**
     *
     * @param value The value to delete an record.
     * @returns By default the deleted record is returned.
     */
    deleteOne(id: string | number): Promise<StrapiApiResponse<T>>;
    /**
     *
     * @param values Array of string or number values to delete many records.
     * @returns return boolean value if the process on success
     */
    deleteMany(ids: string[] | number[]): Promise<{
        success: true;
    }>;
    private _handleValues;
}

declare class StrapiClient {
    private httpClient;
    private options;
    private isNotUserContent;
    private normalizeData;
    private debug;
    constructor(options: StrapiClientOptions);
    auth: StrapiAuthClient;
    /**
     * Perform a model operation.
     *
     * @param name The model name to operate on.
     */
    from<T = any>(contentName: string): StrapiQueryBuilder<T>;
    /**
     *
     * @returns The registered Api URL
     */
    getApiUrl(): string;
    setToken(token: string): void;
    removeToken(): void;
    private _initStrapiAuthClient;
}

declare type StrapiImage = {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: ImageFormats;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: ImageProviderMetaData;
    createdAt: string;
    updatedAt: string;
};
declare type ImageFormatAttribute = {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    provider_metadata: ImageProviderMetaData;
};
declare type ImageProviderMetaData = {
    public_id: string;
    resource_type: string;
};
declare type ImageFormats = {
    large?: ImageFormatAttribute;
    small?: ImageFormatAttribute;
    medium?: ImageFormatAttribute;
    thumbnail?: ImageFormatAttribute;
};

/**
 * Strapi Client Options Object
 *
 * @param url Strapi application url
 *
 * @param apiToken Authorized Api Token
 *
 * @param normalizeData Disables Unified response format. default - true
 *
 * @param headers custom headers
 *
 * @param debug Query log on development. default - false
 *
 * @param persistSession Using browser localstorage to save the current session. default- flase
 *
 */
declare const createClient: (options: StrapiClientOptions) => StrapiClient;

export { SignInCredentials, SignUpCredentials, StrapiClient, StrapiClientOptions, StrapiImage, StrapiPopulatedResponse, StrapiTimestamp, StrapiUnifiedResponse, createClient };
