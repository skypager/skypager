// @ts-nocheck
import { Bus } from './bus.js'
import { SetStateValue, State } from './state.js'
import { AvailableFeatures, features, Feature } from './feature.js'
import { Helper } from './helper.js'
import uuid from 'node-uuid'
import hashObject from 'object-hash'
import { uniq, keyBy, uniqBy, groupBy, debounce, throttle, mapValues, mapKeys, pick, get, set, omit, uniq, kebabCase, camelCase, upperFirst, lowerFirst } from 'lodash-es'

const { v4 } = uuid

const stringUtils = { kebabCase, camelCase, upperFirst, lowerFirst }

export type { AvailableFeatures }

// I want the InstanceType of each value of AvailableFeatures, AvailableClients, whatever
export type AvailableInstanceTypes<T> = {
  [K in keyof T]: T[K] extends new (...args: any) => any ? InstanceType<T[K]> : never
} 

/**
 * You'll want to use module augmentation to add your own options to the ContainerArgv interface
 */
export interface ContainerArgv {
  _?: string[]
}

export interface ContainerState { 
  started: boolean;
  enabledFeatures: string[];
}

export interface Plugin<T> {
  attach?: (container: Container<any> & T, options?: any) => any 
}

export type Extension<T> = 'string' | keyof AvailableFeatures | Plugin<T> | { attach: (container: Container<any>, options?: any) => T}

export interface ContainerContext<T extends AvailableFeatures = any> {
  container: Container<T> 
}

export class Container<Features extends AvailableFeatures = AvailableFeatures, ContainerState extends ContainerState = ContainerState > {
  readonly uuid = v4()
  private readonly _events = new Bus()
  private readonly _state: State<ContainerState>

  /**
   * You can use module augmentation to define the starting interface for your container
   * whether it is process.argv, process.env, or some combination thereof
   */
  readonly options: ContainerArgv

  constructor(options: ContainerArgv) {
    this.options = options
    this._state = new State<ContainerState>()
    
    this.state
      .set('enabledFeatures', [])
      .set('started', false)
      
    this._hide('options', '_state', '_events', 'uuid', '_plugins')
    
    this.on('featureEnabled', (featureId: string) => {
      this.state.set('enabledFeatures', uniq([
        ...this.state.get('enabledFeatures')!,
        featureId
      ]))  
    })

    this.state.observe(() => {
      this.emit('stateChange', this.state.current)
    })
  }
  
  get state() {
    return this._state
  }
  
  get enabledFeatureIds() {
    return this.state.get('enabledFeatures') || []
  }
  
  get enabledFeatures() : Partial<AvailableInstanceTypes<Features>> {
    return Object.fromEntries(
      this.enabledFeatureIds.map((featureId) => [featureId, (this as any)[featureId]])  
    ) as AvailableInstanceTypes<Features>
  }
  
  utils = {
    hashObject: (obj: any) => hashObject(obj, { ignoreUnknown: true }),
    get stringUtils() { return stringUtils },
    uuid: () => v4(),
    lodash: {
      uniq, keyBy, uniqBy, groupBy, debounce, throttle, mapValues, mapKeys, pick, get, set, omit,
    }
  }

  get context(): ContainerContext<Features> & Partial<AvailableInstanceTypes<AvailableFeatures>> {
    return { 
      ...this.enabledFeatures,
      container: this as Container<Features>,
    }
  }
  
  get currentState() {
    return this.state.current
  }

  setState(newState: SetStateValue<ContainerState>) {
    this.state.setState(newState)
    return this
  }

  get Feature() {
    return Feature
  }

  get Helper() {
    return Helper
  }

  get State() {
    return State
  }

  get features() {
    return features
  }
  
  bus() {
    return new Bus()
  }
  
  newState<T extends object = any>(initialState: T = {} as T) {
    return new State<T>({ initialState })
  }

  feature<T extends keyof Features>(
    id: T,
    options?: ConstructorParameters<Features[T]>[0]
  ): InstanceType<Features[T]> {
    const BaseClass = this.features.lookup(id as string) as Features[T];

    const cacheKey = hashObject({ id, options: omit(options!, 'enable'), uuid: this.uuid })
    const cached = helperCache.get(cacheKey)
    
    if (cached) {
      return cached as InstanceType<Features[T]>
    }
    
    const instance = new (BaseClass as any)(options || {}, { container: this }) as InstanceType<Features[T]>;
    
    helperCache.set(cacheKey, instance)
    
    return instance
  }
  
  async start() {
    this.emit('started')
    this.state.set('started', true)
    return this  
  }
  
  get isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }
  
  get isNode() {
    return typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.node !== 'undefined'
  }
  
  get isElectron() {
    return typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.electron !== 'undefined'
  }
  
  get isDevelopment() {
    return process.env.NODE_ENV === 'development'
  }
  
  get isProduction() {
    return process.env.NODE_ENV === 'production'
  }
  
  get isCI() {
    return process.env.CI === 'true'
  }

  emit(event: string, ...args: any[]) {
    this._events.emit(event, ...args)
    return this
  }

  on(event: string, listener: (...args: any[]) => void) {
    this._events.on(event, listener)
    return this
  }

  off(event: string, listener?: (...args: any[]) => void) {
    this._events.off(event, listener)
    return this
  }

  once(event: string, listener: (...args: any[]) => void) {
    this._events.once(event, listener)
    return this
  }

  /** 
   * Returns a promise that will resolve when the event is emitted
  */
  async waitFor(event: string) {
    const resp = await this._events.waitFor(event)
    return resp
  }

  _hide(...propNames: string[]) {
    propNames.map((propName) => {
      Object.defineProperty(this, propName, { enumerable: false })
    })
    
    return this
  }

  async sleep(ms = 1000) {
    await new Promise((res) => setTimeout(res,ms))    
    return this
  }

  _plugins: (() => void)[] = []
  use<T = {}>(plugin: Extension<T>, options: any = {}) : this & T {
    const container = this

    if(typeof plugin === 'string') {
      const featureId = plugin as keyof AvailableFeatures
      this.feature(featureId, {
        ...options,
        enable: true
      })
    } else if ((typeof plugin === 'object' || typeof plugin === 'function') && typeof plugin?.attach === 'function') {
      // This is like using a Helper or Feature subclass which declares a static attach method
      plugin.attach(container as this & T, options)  
    }
    
    return this as (this & T)
  }
}

const helperCache = new Map()
