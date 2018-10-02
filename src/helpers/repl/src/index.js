import Repl from './Repl'

export { Repl }

export default Repl

export function attach(runtime) {
  Repl.attach(runtime)
}
