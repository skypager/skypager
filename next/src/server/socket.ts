import type { NodeContainer } from '../node/container.js'
import { StartOptions, servers, Server, ServersInterface, ServerState, ServerOptions } from './server.js';
import { WebSocketServer as BaseServer } from 'ws'

declare module './index' {
  interface AvailableServers {
    websocket: typeof WebsocketServer
  }
}

export interface SocketServerOptions extends ServerOptions {
  json?: boolean;
}

export class WebsocketServer<T extends ServerState = ServerState, K extends SocketServerOptions = SocketServerOptions> extends Server<T,K> {
    static attach(container: NodeContainer & ServersInterface) {
      container.servers.register('websocket', WebsocketServer)
      return container
    }
    
    _wss?: BaseServer 

    get wss() {
      if (this._wss) {
        return this._wss
      }
      
      return this._wss = new BaseServer({ 
        port: this.port 
      })
    }

    connections : Set<any> = new Set()

    async broadcast(message: any) {
      for(const ws of this.connections) {
        await ws.send(JSON.stringify(message))
      }
      
      return this
    }
    
    async send(ws: any, message: any) {
      await ws.send(JSON.stringify(message))
      return this
    }

    async start(options?: StartOptions) {
      if(!this.isConfigured) {
        await this.configure()
      }
      
      const { wss } = this
      
      wss.on('connection', (ws) => {
        this.connections.add(ws)
        this.emit('connection', ws)
        
        ws.on('message', (data) => {
          this.emit('message', data, ws)  
        })
      })
      
      this.state.set('listening', true)

      return this
    }
    
    get port() {
      return this.state.get('port') || this.options.port || 8081 
    }
}

export default servers.register('websocket', WebsocketServer)