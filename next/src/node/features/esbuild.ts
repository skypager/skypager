import * as esbuild from 'esbuild'
import { Feature, features } from '../feature.js'
import { NodeContainer } from '../container.js'

export class ESBuild extends Feature {
  static attach(c: NodeContainer) {
    c.features.register('esbuild', ESBuild)
  }

  override get shortcut() {
    return 'esbuild' as const
  }

   transformSync(code: string, options?: esbuild.TransformOptions) {
    return esbuild.transformSync(code, {
      loader: 'ts',
      format: 'esm',
      target: 'es2020',
      sourcemap: false,
      minify: false,
      ...options 
    })
  }
 
  async transform(code: string, options?: esbuild.TransformOptions) {
    return esbuild.transform(code, {
      loader: 'ts',
      format: 'esm',
      target: 'es2020',
      sourcemap: false,
      minify: false,
      ...options 
    })
  }

}

export default features.register('esbuild', ESBuild)