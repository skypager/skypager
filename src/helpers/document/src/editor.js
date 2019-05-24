import EditorComponent from './components/BundledEditor'
import RunnableComponent from './components/Runnable'
import RenderableComponent from './components/Renderable'

export function Runnable(props = {}) {
  return <RunnableComponent Editor={EditorComponent} {...props} />
}

export function Renderable(props = {}) {
  return <RenderableComponent Editor={EditorComponent} {...props} />
}

export function Editor(props = {}) {
  const renderable = String(props.renderable) === 'true'
  const editable = String(props.editable) === 'true'
  const runnable = String(props.runnable) === 'true'

  if (runnable) {
    return <Runnable {...props} />
  } else if (renderable) {
    return <Renderable {...props} />
  } else if (editable) {
    return <EditorComponent {...props} />
  } else {
    return <EditorComponent {...props} readOnly />
  }
}

export default Editor
