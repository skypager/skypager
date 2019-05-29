import Babel from './babel/babel'
import VmRunner from './features/vm-runner'
import editor from './features/editor'
import bundle from './features/bundle'
import Mdx from './mdx/mdx.node.js'

export function attach(runtime, opts) {
  runtime.features.add({
    'vm-runner': VmRunner,
    editor,
    bundle,
  })

  runtime.Babel = Babel
  runtime.Mdx = Mdx

  Babel.attach(runtime)
  Mdx.attach(runtime)

  runtime.mdxDocs.babelConfig = (options = {}) =>
    require('@skypager/helpers-mdx/babel-config')({
      modules: true,
      ...(opts.babelConfig || {}),
      ...options,
    })
}
