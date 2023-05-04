import { Feature, features } from '../feature.js'
import os from 'os'

export class OS extends Feature {
  get shortcut() {
    return 'os' as const
  }
  
  get arch() {
    return os.arch()
  }
  
  get tmpdir() {
    return os.tmpdir()
  }
  
  get homedir() {
    return os.homedir()
  }
  
  get cpuCount() {
    return os.cpus().length
  }

  get hostname() {
    return os.hostname()
  }

  get platform() {
    return os.platform()
  }
  
  get networkInterfaces() {
    return os.networkInterfaces()
  }
  
  get macAddresses() : string[] {
    return Object.values(this.networkInterfaces).flat().filter(v => typeof v !== 'undefined' && v.internal === false && v.family === 'IPv4').map(v => v?.mac!).filter(Boolean)
  }
}

export default features.register('os', OS)