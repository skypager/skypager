import cacache from "cacache";
import { Feature, FeatureOptions, FeatureState, features } from "../feature.js";
import { NodeContainer } from "../container.js";
import { partial } from "lodash-es";
import { ContainerContext } from "../../container.js";
import { mkdirSync } from "fs";

export interface DiskCacheOptions extends FeatureOptions {
  encrypt?: boolean;
  secret?: Buffer;
  path?: string;
}

export class DiskCache extends Feature<FeatureState,DiskCacheOptions> {
  static attach(c: NodeContainer) {}

  constructor(options: DiskCacheOptions, context: ContainerContext) {
    super(options, context)
    this._cache = this.create() 
    this.hide('_cache')
  }
  
  get cache() {
    return this._cache
  }

  override get shortcut() {
    return "diskCache" as const;
  }
 
  async get(key: string, json = false) {
    const val = this.options.encrypt 
      ? await this.securely.get(key) 
      : await this.cache.get(key).then((data: any) => data.data.toString())
    
    if (json) {
      try {
        return JSON.parse(val)
      } catch(error) {
        return { error: "parse error "}
      }
    } else {
      return val
    }
  }
  
  async set(key: string, value: any) {
    if (this.options.encrypt) {
      return this.securely.set(key, value)
    }

    if(typeof value !== 'string') {
      return this.cache.put(key, Buffer.from(JSON.stringify(value))) 
    } else {
      return this.cache.put(key, Buffer.from(value))
    }
  }

  async listKeys() {
    return this.cache.ls().then((results: Record<string,any>) => Object.keys(results))
  }
  
  get securely() {
    const { secret, encrypt } = this.options
    
    if (!encrypt) {
      throw new Error(`Cannot use securely without encryption enabled`)
    }

    if (!secret) {
      throw new Error(`Cannot use securely without a secret`) 
    }
    
    const vault = this.container.feature('vault', {
      secret
    })
    
    const { cache } = this

    return {
      async set(name: string, payload: any) {
        const encrypted = vault.encrypt(payload)
        return cache.put(name, Buffer.from(encrypted))
      },
      async get(name: string) {
        const value = await cache.get(name).then((data: any) => data.data.toString())
        return vault.decrypt(value)
      }  
    }
  }
 
  _cache!: ReturnType<typeof this.create>
 
  create(path?: string) {
    path = path || this.options.path || this.container.paths.resolve('node_modules', '.cache', 'luca-disk-cache')
    mkdirSync(path, { recursive: true })
    const arg = (fn: (...args: any) => any) => partial(fn, path);

    const ls = arg(cacache.ls);
    const get = arg(cacache.get);
    const put = arg(cacache.put);
    const rm = arg(cacache.rm);
    const verify = arg(cacache.verify);

    return {
      ...cacache,
      cachePath: path, 
      ls: Object.assign(ls, {
        stream: arg(cacache.ls.stream),
      }),
      get: Object.assign(get, {
        stream: arg(cacache.get.stream),
        byDigest: arg(cacache.get.byDigest),
        copy: arg(cacache.get.copy),
        info: arg(cacache.get.info),
        hasContent: arg(cacache.get.hasContent),
      }),
      put: Object.assign(put, {
        stream: arg(cacache.put.stream),
      }),
      rm: Object.assign(rm, {
        all: arg(cacache.rm.all),
        entry: arg(cacache.rm.entry),
        content: arg(cacache.rm.content),
      }),
      tmp: {
        mkdir: arg(cacache.tmp.mkdir),
        withTmp: arg(cacache.tmp.withTmp),
      },
      verify: Object.assign(verify, {
        lastRun: arg(cacache.verify.lastRun),
      }),
    };
  }
}

export default features.register("diskCache", DiskCache);
