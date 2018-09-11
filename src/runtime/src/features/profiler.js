export const featureMethods = ['profileStart', 'profileEnd', 'getReport', 'start', 'end']

export const createGetter = 'profiler'

export function getReport() {
  const timings = this.runtime.convertToJS(this.timings.toJSON())

  return this.chain
    .plant(timings)
    .pickBy(v => v.start && v.end)
    .mapValues(({ start, end }) => ({
      start,
      end,
      duration: end - start,
    }))
    .value()
}

export function observables() {
  return {
    timings: ['shallowMap', []],
  }
}

export function profileEnd(eventName) {
  try {
    const stamp = +new Date()

    this.timings.set(eventName, {
      ...(this.timings.get(eventName) || {}),
      end: stamp,
    })
  } catch (error) {}
}

export function profileStart(eventName) {
  const stamp = +new Date()
  try {
    this.timings.set(eventName, {
      start: stamp,
    })
  } catch (error) {}

  return stamp
}

export const start = profileStart
export const end = profileEnd
