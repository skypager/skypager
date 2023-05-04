export * from './server.js'
export * from './express.js'
export * from './socket.js'

import { servers as registry } from './server.js'
import { ExpressServer } from './express.js'
import { WebsocketServer } from './socket.js'

registry.register('express', ExpressServer)
registry.register('websocket', WebsocketServer)

export const servers = registry

export interface AvailableServers {
  express: typeof ExpressServer;
  websocket: typeof WebsocketServer;  
}