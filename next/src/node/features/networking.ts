import { Feature, features } from '../feature.js'
import detectPort from 'detect-port'

export class Networking extends Feature {
  override get shortcut() {
    return 'networking' as const
  }
  
  async findOpenPort(startAt = 0) {
    const nextPort = await detectPort(Number(startAt))
    return nextPort
  }
  
  async isPortOpen(checkPort = 0) {
    const nextPort = await detectPort(Number(checkPort))
    return nextPort && nextPort === Number(checkPort)    
  }
}

export default features.register('networking', Networking)