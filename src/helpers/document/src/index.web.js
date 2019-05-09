// import Babel from './babel/babel'
import Mdx from './mdx/mdx'
import Skypage from './components/Skypage'
import Editor from './components/Editor'
import editor from './features/editor'
import VmRunner from './features/vm-runner'

export { Skypage, Editor }

export function attach(runtime) {
  runtime.features.add({
    'vm-runner': VmRunner,
    editor,
  })

  Mdx.attach(runtime)
}
