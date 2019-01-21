// import Babel from './babel/babel'
import Mdx from './mdx/mdx'
import Skypage from './components/Skypage'

export { Skypage }
export function attach(runtime) {
  // Babel.attach(runtime)
  Mdx.attach(runtime)
}
