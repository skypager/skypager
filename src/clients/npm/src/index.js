import * as NpmClient from './clients/npm'

export function attach(runtime) {
  runtime.onRegistration('clients', () => {
    if (!runtime.clients.checkKey('npm')) {
      runtime.clients.register('npm', () => NpmClient)
    }
  })
}
