import Babel from './babel/babel'
import Mdx from './mdx/mdx'
import VmRunner from './features/vm-runner'
import editor from './features/editor'
import bundle from './features/bundle'

export function attach(runtime) {
  runtime.features.add({
    'vm-runner': VmRunner,
    editor,
    bundle,
  })

  runtime.Babel = Babel
  runtime.Mdx = Mdx
  Babel.attach(runtime)
  Mdx.attach(runtime)
}
