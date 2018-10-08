/* eslint-disable */
/* @copyright github/tur-nr */
export default bindTo => {
  const stack = []
  const use = (...fns) => {
    let i = fns.length
    while (i--) {
      const fn = fns[i]
      if (Array.isArray(fn)) return use(...fn)
      if ('function' === typeof fn) stack.unshift(fn)
    }
  }
  const run = done => {
    let i = stack.length
    const next = (err = null, fin) => {
      if (err || fin || !i) {
        if ('function' === typeof done) done(err)
        return
      }
      const mw = stack[--i]
      if (mw && typeof mw.apply !== 'undefined') mw.call(bindTo, next)
    }
    next()
  }

  const getCount = () => stack.length

  return { use, run, getCount }
}
