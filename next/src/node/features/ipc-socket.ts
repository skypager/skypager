import { FeatureState, Feature, features } from "../feature.js";
import { NodeContainer } from "../container.js";
import { Server, Socket } from "net";

export interface IpcState extends FeatureState {
  mode?: 'server' | 'client'
}

export class IpcSocket<T extends IpcState = IpcState> extends Feature<T> {
  server?: Server;
  protected sockets: Set<Socket> = new Set();

  static attach(container: NodeContainer & { ipcSocket?: IpcSocket }) {
    container.features.register("ipcSocket", IpcSocket);
    container.ipcSocket = container.feature("ipcSocket", { enable: true });
  }

  override get shortcut() {
    return "ipcSocket" as const;
  }
  
  get isClient() {
    return this.state.get('mode') === 'client'
  }
  
  get isServer() {
    return this.state.get('mode') === 'server'
  }

  async listen(socketPath: string, removeLock = false): Promise<Server> {
    socketPath = this.container.paths.resolve(socketPath)

    if (this.container.fs.exists(socketPath)) {
      if(removeLock) {
        await this.container.fs.rm(socketPath)
      } else {
        throw new Error('Lock already exists')
      }
    }

    if(this.isClient) {
      throw new Error("Cannot listen on a client socket.");
    }

    this.state.set('mode', 'server')

    if (this.server) {
      throw new Error("An IPC server is already running.");
    }

    this.server = new Server((socket) => {
      this.sockets.add(socket);

      socket.on("close", () => {
        this.sockets.delete(socket);
      });
      
      socket.on('data', (data) => {
        this.emit('message', JSON.parse(String(data)))
      })
      
      this.emit('connection', socket)
    });

    this.server.listen(socketPath);

    return this.server;
  }

  stopServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error("No IPC server is running."));
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      this.sockets.forEach((socket) => socket.destroy());
      this.sockets.clear();
      this.server = undefined;
    });
  }

  _connection?: Socket

  get connection() {
    return this._connection
  }

  broadcast(message: any) {
    this.sockets.forEach((socket) => socket.write(JSON.stringify({
      data: message,
      id: this.container.utils.uuid()
    })))    

    return this
  }

  async send(message: any) {
    const id = this.container.utils.uuid()

    if(!this._connection) {
      throw new Error("No connection.")
    }
    
    this._connection.write(JSON.stringify({ id, data: message }))
  }

  async connect(socketPath: string): Promise<Socket> {
    if(this.isServer) {
      throw new Error("Cannot connect on a server socket.")
    }

    if(this._connection) {
      return this._connection
    }

    const connection : Socket = await new Promise((resolve, reject) => {
      const socket = new Socket();
      socket.connect(socketPath, () => {
        resolve(socket);
      });

      socket.on("error", (err) => {
        reject(err);
      });
    });
    
    connection.on("close", () => {
      this._connection = undefined
    })
    
    connection.on("data", (data) => {
      this.emit('message', JSON.parse(String(data)))
    })
    
    return this._connection = connection as Socket
  }
}

export default features.register("ipcSocket", IpcSocket);
