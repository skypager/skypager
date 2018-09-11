import Repl from './helper'

export { Repl }

export default Repl

export function attach(runtime) {
  Repl.attach(this)
}
