import * as homeDirectory from './home-directory.js'

export function attach(runtime) {
  runtime.features.register('home-directory', () => homeDirectory)
}
