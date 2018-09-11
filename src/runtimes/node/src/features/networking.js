import detectPort from 'detect-port'

export const createGetter = 'networking'

export const featureMethods = ['isPortOpen', 'findOpenPort']

export const isObservable = true
export const initialState = {
  connected: true,
}

export async function findOpenPort(port) {
  const nextPort = await detectPort(typeof port === 'object' || !port ? 0 : port)
  return nextPort
}

export async function isPortOpen(port) {
  const nextOpenPort = await detectPort(port)
  return nextOpenPort && parseInt(nextOpenPort, 10) === parseInt(port)
}
