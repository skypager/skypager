import { Feature } from '@skypager/runtime/lib/feature'
import detectPort from 'detect-port'

export default class NetworkingFeature extends Feature {
  shortcut = 'networking'

  async findOpenPort(port) {
    const nextPort = await detectPort(typeof port === 'object' || !port ? 0 : port)
    return nextPort
  }

  async isPortOpen(port) {
    const nextOpenPort = await detectPort(port)
    return nextOpenPort && parseInt(nextOpenPort, 10) === parseInt(port)
  }
}
