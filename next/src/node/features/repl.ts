import { Feature, FeatureOptions, FeatureState, features } from "../feature.js";
import { start } from 'repl'
import vm from 'vm'

export interface ReplState extends FeatureState {
  started?: boolean;
}

export interface ReplOptions extends FeatureOptions {
  prompt?: string;
  historyPath?: string;
}

export class Repl<
  T extends ReplState = ReplState,
  K extends ReplOptions = ReplOptions
> extends Feature<T, K> {
  get isStarted() {
    return !!this.state.get("started");
  }

  _server?: ReturnType<typeof start> 

  get server() {
    const { prompt = "> " } = this.options;
    const server = start({
      useGlobal: false,
      useColors: true,
      terminal: true,
      prompt,
      eval: (
        command: string,
        context: any,
        file: string,
        cb: (err: any, result: any) => void
      ) => {
        const script = new vm.Script(command);
        const result = script.runInContext(context);

        if (typeof result?.then === "function") {
          result
            .then((result: any) => cb(null, result))
            .catch((e: any) => cb(null, e));
        } else {
          cb(null, result);
        }
      },
    });
   
    return this._server = server
  }

  async start(options: { historyPath?: string, context?: any, exclude?: string | string[] } = {}) {
    if (this.isStarted) {
      return this;
    }
    
    const userHistoryPath = options.historyPath || this.options.historyPath
    const { server } = this
    
    const historyPath = typeof userHistoryPath === 'string' 
      ? this.container.paths.resolve(userHistoryPath)
      : this.container.paths.resolve('node_modules', '.cache', '.repl_history')
    
    this.container.fs.ensureFolder(historyPath)
    //await this.container.fs.ensureFileAsync(historyPath, '', false)

    await new Promise((res,rej) => {
      server.setupHistory(historyPath, (err) => {
        err ? rej(err) : res(true)
      })
    })
    
    Object.assign(server.context, this.container.context, options.context || {})

    return this;
  }
}

export default features.register("repl", Repl);
