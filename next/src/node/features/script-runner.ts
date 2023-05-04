import { Feature, features } from '../feature.js'

export class ScriptRunner extends Feature {
  get shortcut() {
    return 'scriptRunner' as const
  }
  
  get scripts() {
    const { proc } = this.container
    const { stringUtils } = this.container.utils
    
    type spawner = (args: string[], options: any) => ReturnType<typeof proc.spawnAndCapture>
    type Runner = Record<string, spawner>
    
    const scriptNames = Object.keys(this.container.manifest.scripts || {})
    
    const runner : Runner = {}
    
    scriptNames.forEach(scriptName => {
      const id = stringUtils.camelCase(stringUtils.kebabCase(scriptName.replace(/:/g, '_')))
      runner[id] = ((args: string[], opts: any = {}) => proc.spawnAndCapture('npm',['run', scriptName].concat(args), opts)) as spawner
    })
   
    return runner
  }
  
}

export default features.register('scriptRunner', ScriptRunner)