import runtime from '@skypager/runtime'

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime) {
  runtime.use(require('./helper'))
}
