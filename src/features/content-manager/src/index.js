import { Feature } from '@skypager/runtime'

export default class ContentManager extends Feature {
  static isCacheable = true
  static isObservable = true
  static shortcut = 'cms'
  static attach = attach
}

export function attach(runtime, opts) {
  runtime.features.add({
    'content-manager': () => ContentManager,
  })

  runtime.feature('content-manager').enable(opts)
}
