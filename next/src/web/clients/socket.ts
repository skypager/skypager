import Websocket from 'isomorphic-ws'
import { Client, clients, ClientState, ClientOptions } from '../../client'

declare module '../../client' {
  interface AvailableClients {
    websocket: typeof SocketClient
  }
}

export interface SocketState extends ClientState {
  connectionError?: any
}

export interface SocketOptions extends ClientOptions {
  reconnect?: boolean
}

export class SocketClient<T extends SocketState = SocketState, K extends SocketOptions = SocketOptions> extends Client<T,K> {
  ws?: Websocket
  
  static attach(...args: any[]) {
    clients.register('websocket', SocketClient)
  }

  afterInitialize(): void {
    const { reconnect } = this.options

    this.on('close', () => {
      if(reconnect) {
        this.connect()
      }  
    })
  }

  async send(data: any) {
    if(!this.isConnected && !this.hasError) {
      await this.connect() 
    }
    
    if(typeof this.ws === 'undefined') {
      throw new Error(`Missing websocket instance`)
    }
    
    this.ws.send(JSON.stringify({
      id: this.container.utils.uuid(),
      data
    }))
  }

  get hasError() {
    return !!this.state.get('connectionError')
  }

  override async connect() {
    if(this.isConnected) {
      return this
    }
    
    const ws = this.ws = new Websocket(this.options.baseURL!)

    await new Promise((res,rej) => {
      ws.onopen = res  
      ws.onerror = rej

      ws.onmessage = (data: any) => {
        this.emit('message', data)
      }

      ws.onclose = () => {
        this.emit('close')
        this.state.set('connected', false)
      }
    }).catch((error) => {
      this.state.set('connectionError', error)
      throw error
    })

    return this  
  }
}

export default clients.register('websocket', SocketClient)