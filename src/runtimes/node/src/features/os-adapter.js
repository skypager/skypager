import { Feature } from '@skypager/runtime/lib/helpers/feature'
import * as os from 'os'

export default class OsAdapterFeature extends Feature {
  get os() {
    return this.options.os || os
  }

  get platform() {
    return this.os.platform()
  }

  get arch() {
    return this.os.arch()
  }

  get environment() {
    return process.env || {}
  }

  get uptime() {
    return this.os.uptime()
  }

  get cpuCount() {
    return this.os.cpus().length
  }

  get macAddresses() {
    const { values, flatten, uniq } = this.lodash
    return uniq(flatten(values(this.networkInterfaces)).map(int => int.mac))
  }

  get networkInterfaces() {
    const { omitBy } = this.lodash
    return omitBy(this.os.networkInterfaces(), v => v.find(a => a.address === '127.0.0.1'))
  }

  get hostname() {
    return process.env.SKYPAGER_HOSTNAME || this.os.hostname()
  }
}
