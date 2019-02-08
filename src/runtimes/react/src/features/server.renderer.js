import { Feature } from '@skypager/runtime/lib/feature'

import {
  renderToStaticMarkup,
  renderToString,
  renderToNodeStream,
  renderToStaticNodeStream,
} from 'react-dom/server'

export default class ServerRenderer extends Feature {
  static shortcut = 'renderer'

  shortcut = 'renderer'

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
