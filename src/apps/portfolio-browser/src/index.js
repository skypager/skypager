import * as PortfolioBrowser from './server'

export function attach(runtime) {
  runtime.onRegistration('servers', () => {
    runtime.servers.register('portfolio-browser', () => PortfolioBrowser)
  })
}
