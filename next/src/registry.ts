import type { Helper, HelperOptions } from './helper.js';
import type { ContainerContext } from './container.js';
import { Bus } from './bus.js';

abstract class Registry<T extends Helper> {
  members = new Map<string, new (options: HelperOptions, context: ContainerContext) => T>();

  private readonly _events = new Bus();

  constructor() {}

  /** 
   * A registry can discover members from a variety of sources.
   * 
   * Imagine a Remix or Next.js app which has a pages directory from which
   * it wires up all of your routes.  You could do something similar and register
   * a page helper for each file in the pages subtree.
  */
  async discover(options: any) {}

  register(id: string, constructor: new (options: HelperOptions, context: ContainerContext) => T) {
    this.members.set(id, constructor);
  
    return constructor
  }
  
  has(id: string) {
    return this.members.has(id)
  }

  lookup(id: string) {
    if (!this.members.has(id)) {
      throw new Error(`No such member: ${id}`);
    }

    return this.members.get(id)!;
  }
  
  get available() {
    return Array.from(this.members.keys()) 
  }
  
  emit(event: string, ...args: any[]) {
    this._events.emit(event, ...args)
    return this
  }
  
  on(event: string, listener: (...args: any[]) => void) {
    this._events.on(event, listener)
    return this
  }
  
  off(event: string, listener: (...args: any[]) => void) {
    this._events.off(event, listener)
    return this
  }
  
  once(event: string, listener: (...args: any[]) => void) {
      this._events.once(event, listener)
      return this
  }
}

export { Registry }