/**
  This initializer is used by the global skypager runtime to tap into the
  initialization cycle and add the core
*/
export function initializer(next) {
  const runtime = this

  if (runtime.state.get('initializerFinished')) {
    next && next.call && next()
    return
  }

  try {
    runtime.feature('runtimes/node').enable()
    runtime.state.set('initializerFinished', true)
    next && next.call && next()
  } catch (error) {
    next && next.call && next(error)
  }
}
