import type { NodeContainer } from '../node/container.js'
import type { HelperOptions, HelperState } from '../helper.js'
import { Helper } from '../helper.js'
import { Registry } from '../registry.js'
import type { AvailableServers } from './index.js'

export interface ServerState extends HelperState {
  port?: number;
  listening?: boolean;  
  configured?: boolean;
  stopped?: boolean;
}

export interface ServerOptions extends HelperOptions {
  port?: number;
  host?: string;
}

export type StartOptions = {
  port?: number;
  host?: string;
}

export type ServerFactory = (
      key: keyof AvailableServers, 
      options?: ConstructorParameters<AvailableServers[keyof AvailableServers]>[0]
) => NonNullable<InstanceType<AvailableServers[keyof AvailableServers]>>

export interface ServersInterface {
  servers: ServersRegistry;
  server: ServerFactory 
}

const makeFactory = (container: NodeContainer & ServersInterface) : ServerFactory => {
  const factory : ServerFactory = (key: keyof AvailableServers, options) => {
    const Server = container.servers.lookup(key as keyof AvailableServers)
    const server = new Server(options!, container.context)
    return server as NonNullable<InstanceType<AvailableServers[keyof AvailableServers]>>
  }
  
  return factory
}

export class Server<T extends ServerState = ServerState, K extends ServerOptions = ServerOptions> extends Helper<T, K> {
    get initialState() : T {
      return ({
        port: this.options.port || 3000,
        listening: false,
        configured: false,
        stopped: false
      } as unknown) as T
    }
    
    get options() : K {
      return {
        port: 3000,
        host: '0.0.0.0',
        ...this._options,
      }
    }

    static attach(container: NodeContainer & ServersInterface) {
      container.servers = servers
      
      Object.assign(container, {
        server<T extends keyof AvailableServers>(
          id: T,
          options?: ConstructorParameters<AvailableServers[T]>[0]
        ): InstanceType<AvailableServers[T]> {
          const { hashObject } = container.utils
          const BaseClass = servers.lookup(id as keyof AvailableServers) as AvailableServers[T]
      
          const cacheKey = hashObject({ __type: "server", id, options, uuid: container.uuid })
          const cached = helperCache.get(cacheKey)
      
          if (cached) {
            return cached as InstanceType<AvailableServers[T]>
          }
      
          const helperOptions = options as ConstructorParameters<AvailableServers[T]>[0]
          
          const instance = new (BaseClass as any)(helperOptions, container.context) as InstanceType<
            AvailableServers[T]
          >
      
          helperCache.set(cacheKey, instance)
      
          return instance
        }        
      })
      
      return container
    }

    override get container() : NodeContainer {
        return super.container as NodeContainer
    }

    get isListening() {
      return !!this.state.get('listening')
    }
    
    get isConfigured() {
      return !!this.state.get('configured')
    }
    
    get isStopped() {
      return !!this.state.get('stopped')
    }

    get port() {
      return this.state.get('port') || this.options.port || 3000 
    }
    
    async stop() {
      if(this.isStopped) {
        return this
      }
      
      this.state.set('stopped', true)
      
      return this  
    }

    async start(options?: StartOptions) {
      if(this.isListening) {
        return this
      }

      this.state.set('listening', true)
      
      return this
    }
    
    async configure() {
      const port = await this.container.networking.findOpenPort(this.port)
      
      if(port !== this.port) {
        this.state.set('port', port)  
      }

      this.state.set('configured', true)

      return this
    }
}

export class ServersRegistry extends Registry<Server<any>> { }

export const servers = new ServersRegistry()

export const helperCache = new Map()