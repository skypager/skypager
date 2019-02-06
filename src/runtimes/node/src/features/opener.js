import opn from 'opn'
import { Feature } from '@skypager/runtime/lib/feature'

/**
 * @class OpenerFeature
 * @classdesc The Opener Feature opens urls using the local machine's default opening mechanism, most useful in opening urls in a browser
 */
export default class OpenerFeature extends Feature {
  shortcut = 'opener'

  /**
   * Open a file using the OS default association for that file type
   *
   * @param {*} url
   * @param {*} [options={}]
   * @returns {PromiseLike}
   * @memberof OpenerFeature
   */
  open(path, options = {}) {
    return opn(path, options)
  }

  /**
   * Open a URL in a browser
   *
   * @param {*} url
   * @param {*} [options={}]
   * @returns {PromiseLike}
   * @memberof OpenerFeature
   */
  openInBrowser(url, options = {}) {
    return opn(url, options)
  }
}
