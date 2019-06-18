import { Feature } from '@skypager/runtime'

export default class DocsManager extends Feature {
  static shortcut = 'docs'
  static isCacheable = true
  static isObservable = true

  get all() {
    return this.runtime.mdxDocs.allInstances()
  }

  get indexes() {
    return this.all.filter(({ name }) => name.endsWith('index'))
  }

  acceptContext(requireContext) {
    this.runtime.mdxDocs.add(requireContext)
  }
}