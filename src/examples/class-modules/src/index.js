import runtime from '@skypager/node'
import MyFeature from './features/MyFeature'

runtime.features.register('my-feature', () => MyFeature)

export function run() {
  /** @type MyFeature */
  const me = runtime.feature('my-feature')
  const nice = me.doSomething()
  me.enable()

  runtime.repl('interactive').launch({ runtime, MyFeature, me })
}
