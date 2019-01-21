import Babel from './babel/babel'
import Mdx from './mdx/mdx'

export function attach(runtime) {
  runtime.Babel = Babel
  runtime.Mdx = Mdx
  Babel.attach(runtime)
  Mdx.attach(runtime)
}
