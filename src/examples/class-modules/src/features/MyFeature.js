import { Feature } from '@skypager/runtime/lib/helpers/feature'

/**
 * An Awesome Feature
 *
 * @typedef Nice
 * @property {string} wow -something awesome
 */

/**
 * @export
 * @class MyFeature
 * @extends {Feature}
 */
export default class MyFeature extends Feature {
  shortcut = 'myFeature'

  /**
   * do something nice
   *
   * @param {*} nice
   * @returns
   * @memberof MyFeature
   *
   * @returns {Nice}
   */
  doSomething(nice) {
    return {
      wow: 'something',
    }
  }
  /**
   * This is just amazing
   *
   * @readonly
   * @memberof MyFeature
   */
  get wow() {
    return 'thisWorks'
  }
}

// MyFeature.prototype.shortcut = 'myFeature'
