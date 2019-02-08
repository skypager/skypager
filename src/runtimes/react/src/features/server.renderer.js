import { Feature } from '@skypager/runtime/lib/feature'
import { transformAsync } from '@babel/core'

import {
  renderToStaticMarkup,
  renderToString,
  renderToNodeStream,
  renderToStaticNodeStream,
} from 'react-dom/server'

export default class ServerRenderer extends Feature {
  static shortcut = 'renderer'

  shortcut = 'renderer'

  async createModule(es6, sandbox = {}) {
    const code = await this.parse(es6)
    const component = this.runtime.createModule(
      code,
      {
        require: a => this.runtime.currentModule.require(a),
      },
      sandbox
    )

    return component.exports
  }

  async parse(es6) {
    const { runtime } = this

    const { code } = await transformAsync(es6, {
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            modules: 'auto',
            targets: {
              node: 'current',
            },
          },
        ],
        require.resolve('@babel/preset-react'),
      ],
      plugins: [
        [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
        require.resolve('@babel/plugin-proposal-class-properties'),
        require.resolve('@babel/plugin-proposal-export-namespace-from'),
        require.resolve('@babel/plugin-proposal-export-default-from'),
        require.resolve('@babel/plugin-proposal-object-rest-spread'),
        require.resolve('@babel/plugin-transform-runtime'),
      ],
    })

    return code
  }

  renderToHtml(...args) {
    return renderToStaticMarkup(...args)
  }

  renderToString(...args) {
    return renderToString(...args)
  }

  renderToStream(...args) {
    return renderToNodeStream(...args)
  }

  renderToHtmlStream(...args) {
    return renderToStaticNodeStream(...args)
  }
}
