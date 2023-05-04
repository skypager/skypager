import * as yaml from 'js-yaml'
import { Feature, features } from '../feature.js'
import { NodeContainer } from '../container.js'

export class YAML extends Feature {
  static attach(c: NodeContainer) {
    c.feature('yaml', { enable: true })  
  }

  override get shortcut() {
    return 'yaml' as const
  }
  
  stringify(data: any) : string {
    return yaml.dump(data)
  }

  parse<T extends object = any>(yamlStr: string) : T {
    return yaml.load(yamlStr) as T
  }
}

export default features.register('yaml', YAML)