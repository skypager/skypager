import opn from 'opn'
import { Feature } from '@skypager/runtime/lib/feature'

export default class OpenerFeature extends Feature {
  shortcut = 'opener'

  open(path, options = {}) {
    return opn(path, options)
  }

  openInBrowser(url, options = {}) {
    return opn(url, options)
  }
}
