// @ts-nocheck
//
import vm from '../shims/isomorphic-vm'
import { Feature, FeatureOptions, FeatureState, features } from "../feature.js";
import { Container } from '../../container.js';

export interface VMState extends FeatureState { }

export interface VMOptions extends FeatureOptions {
  context?: any
}

export class VM<
  T extends VMState = VMState,
  K extends VMOptions = VMOptions
> extends Feature<T, K> {

  static attach(container: Container) {
    container.features.register('vm', VM)    
  }

  createScript(code: string) {
    return new vm.Script(code)
  }
 
  createContext(ctx: any = {}) {
    return vm.createContext({
      ...this.container.context,
      ...ctx
    })
  }
  
  run(code: string, ctx: any = {}) {
    const script = this.createScript(code)
    const context = this.createContext(ctx)
    
    try {
      return script.runInContext(context)
    } catch(error) {
      console.error(`Error running code`, error)
      return error
    }
  }
}

export default features.register("vm", VM);
