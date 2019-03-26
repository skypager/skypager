import * as NpmClient from './clients/npm'

export function attach(runtime) {
  runtime.onRegistration('clients', () => {
    runtime.clients.register('npm', () => NpmClient)
  })
}
