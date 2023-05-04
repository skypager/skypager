import { Helper, HelperOptions, HelperState } from "./helper.js";
import type { Container, ContainerContext } from "./container.js";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { Registry } from "./registry.js";

export interface ClientOptions extends HelperOptions {
  baseURL?: string;
  json?: boolean;
}

export interface AvailableClients {
  rest: typeof RestClient;
  graph: typeof GraphClient;
}

export interface ClientState extends HelperState {
  connected: boolean;
}

export interface ClientsInterface {
  clients: ClientsRegistry;
  client: (
    key: keyof AvailableClients,
    options?: ConstructorParameters<AvailableClients[keyof AvailableClients]>[0]
  ) => InstanceType<AvailableClients[keyof AvailableClients]>;
}

export class Client<
  T extends ClientState = ClientState,
  K extends ClientOptions = ClientOptions
> extends Helper<T, K> {
  static attach(container: Container & ClientsInterface): any {
    return Object.assign(container, {
      get clients() {
        return clients;
      },

      client<T extends keyof AvailableClients>(
        id: T,
        options?: ConstructorParameters<AvailableClients[T]>[0]
      ): InstanceType<AvailableClients[T]> {
        const { hashObject } = container.utils;
        const BaseClass = clients.lookup(
          id as keyof AvailableClients
        ) as AvailableClients[T];

        const cacheKey = hashObject({
          __type: "client",
          id,
          options,
          uuid: container.uuid,
        });
        const cached = helperCache.get(cacheKey);

        if (cached) {
          return cached as InstanceType<AvailableClients[T]>;
        }

        const helperOptions = (options || {}) as ConstructorParameters<
          AvailableClients[T]
        >[0];

        const instance = new (BaseClass as any)(helperOptions, container.context) as InstanceType<AvailableClients[T]>;

        helperCache.set(cacheKey, instance);

        return instance;
      },
    });
  }

  constructor(options?: K, context?: ContainerContext) {
    if (typeof context !== "object") {
      throw new Error("Client must be instantiated with a context object");
    }

    super((options as K) || {}, context);

    this.state.set("connected", false);
  }

  get options() {
    return this._options as K;
  }

  configure(options?: any): this {
    return this;
  }

  get isConnected() {
    return !!this.state.get("connected");
  }

  async connect(): Promise<this> {
    this.state.set("connected", true);
    return this;
  }
}

export class RestClient<
  T extends ClientState = ClientState,
  K extends ClientOptions = ClientOptions
> extends Client<T, K> {
  axios!: AxiosInstance;

  static attach(container: Container & ClientsInterface): any {
    return container
  }

  constructor(options: K, context: ContainerContext) {
    super(options, context);

    this.axios = axios.create({
      baseURL: this.options.baseURL,
      ...(this.options.json && { headers: { Accept: "application/json", "Content-Type": "application/json" } }),
    });
  }

  patch(url: string, data: any = {}, options: AxiosRequestConfig = {}) {
    return this.axios({
      ...options,
      method: "PATCH",
      url,
      data,
    })
      .then((r) => r.data)
      .catch((e: any) => {
        if (e.isAxiosError) {
          return this.handleError(e);
        } else {
          throw e;
        }
      });
  }
 
  put(url: string, data: any = {}, options: AxiosRequestConfig = {}) {
    return this.axios({
      ...options,
      method: "PUT",
      url,
      data,
    })
      .then((r) => r.data)
      .catch((e: any) => {
        if (e.isAxiosError) {
          return this.handleError(e);
        } else {
          throw e;
        }
      });
  }
 
  post(url: string, data: any = {}, options: AxiosRequestConfig = {}) {
    return this.axios({
      ...options,
      method: "POST",
      url,
      data,
    })
      .then((r) => r.data)
      .catch((e: any) => {
        if (e.isAxiosError) {
          return this.handleError(e);
        } else {
          throw e;
        }
      });
  }

  delete(url: string, params: any = {}, options: AxiosRequestConfig = {}) {
    return this.axios({
      ...options,
      method: "DELETE",
      url,
      params,
    })
      .then((r) => r.data)
      .catch((e: any) => {
        if (e.isAxiosError) {
          return this.handleError(e);
        } else {
          throw e;
        }
      });
  }


  get(url: string, params: any = {}, options: AxiosRequestConfig = {}) {
    return this.axios({
      ...options,
      method: "GET",
      url,
      params,
    })
      .then((r) => r.data)
      .catch((e: any) => {
        if (e.isAxiosError) {
          return this.handleError(e);
        } else {
          throw e;
        }
      });
  }

  handleError(error: AxiosError) {
    return error.toJSON();
  }
}

export class GraphClient<
  T extends ClientState = ClientState,
  K extends ClientOptions = ClientOptions
> extends Client<T, K> {}

export class ClientsRegistry extends Registry<Client<any>> {}

export const clients = new ClientsRegistry();

// @ts-ignore-next-line
clients.register("rest", RestClient);
clients.register("graph", GraphClient);

export const helperCache = new Map();

export default Client;
