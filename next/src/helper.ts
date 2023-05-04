import { Bus } from "./bus.js";
import { SetStateValue, State } from "./state.js";
import type { ContainerContext } from './container.js'
import uuid from 'node-uuid'
import { get } from 'lodash-es'

// @ts-ignore-next-line
export interface HelperState { }

export interface HelperOptions {
  name?: string;
}

/**
 * Helpers are used to represent types of modules.
 *
 * You don't create instances of helpers directly, the container creates instances through
 * factory functions that use the subclasses of Helper as a template.  The container
 * provides dependency injection and injects a context object into the Helper constructor.
 */
export abstract class Helper<T extends HelperState = HelperState, K extends HelperOptions = any> {
  protected readonly _context: ContainerContext
  protected readonly _events = new Bus()
  protected readonly _options: K 

  readonly state: State<T>

  readonly uuid = uuid.v4()

  get initialState() : T {
    return {} as T
  }
  
  constructor(options: K, context: ContainerContext) {
    this._options = options;
    this._context = context;
    this.state = new State<T>({ initialState: this.initialState });
    
    this.hide('_context', '_state', '_options', '_events', 'uuid')
    
    this.state.observe(() => {
      this.emit('stateChange', this.state.current)
    })
    
    this.afterInitialize()
  }

  afterInitialize() {
    // override this method to do something after the helper is initialized
  }
  
  setState(newState: SetStateValue<T>) {
    this.state.setState(newState)
    return this
  }

  hide(...propNames: string[]) {
    propNames.map((propName) => {
      Object.defineProperty(this, propName, { enumerable: false })
    })
    
    return this
  }
  
  tryGet<K extends (string | string[]), T extends object = any>(key: K, defaultValue?: T) {
    return get(this, key, defaultValue)
  }

  get options() {
    return this._options;
  }

  get context() {
    return this._context;
  }

  get container() {
    return this.context.container;
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

  async waitFor(event:string) {
    const resp = await this._events.waitFor(event)
    return resp
  }
}