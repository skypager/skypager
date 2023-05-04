import vm from 'vm'
import { Feature, FeatureOptions, FeatureState, features } from "../feature.js";

export interface VMState extends FeatureState { }

export interface VMOptions extends FeatureOptions {
  context?: any
}

export class VM<
  T extends VMState = VMState,
  K extends VMOptions = VMOptions
> extends Feature<T, K> {
  createScript(code: string, options?: vm.ScriptOptions) {
    return new vm.Script(code, {
      ...options
    })
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
