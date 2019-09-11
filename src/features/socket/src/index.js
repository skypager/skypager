import * as socket from './socket.js'

export function attach(runtime) {
  runtime.features.register('socket', () => socket)
}
