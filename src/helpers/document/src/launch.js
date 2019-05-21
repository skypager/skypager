// import Babel from './babel/babel'
import Mdx from './mdx/mdx'
import Skypage from './components/Skypage'
import EditorComponent from './components/Editor'
import RunnableComponent from './components/Runnable'
import RenderableComponent from './components/Renderable'
import editor from './features/editor'
import VmRunner from './features/vm-runner'
import bundle from './features/bundle'

export function Runnable(props = {}) {
  return <RunnableComponent Editor={EditorComponent} {...props} />
}

export function Renderable(props = {}) {
  return <RenderableComponent Editor={EditorComponent} {...props} />
}

export function Editor(props = {}) {
  if (props.runnable) {
    return <Runnable {...props} />
  } else if (props.renderable) {
    return <Renderable {...props} />
  } else if (props.editable) {
    return <EditorComponent {...props} />
  } else {
    return <EditorComponent {...props} readOnly />
  }
}

export { Skypage }

export function attach(runtime) {
  runtime.features.add({
    'vm-runner': VmRunner,
    editor,
    bundle,
  })

  Mdx.attach(runtime)
}
