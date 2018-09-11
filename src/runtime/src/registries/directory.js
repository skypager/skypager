import SimpleDirectory from './simple'

/**
 * The Directory is a searchable registry
 */
export class Directory extends SimpleDirectory {
  /**
   * Create a new Simple Registry
   * @param  {String} name   The name of this registry
   * @param  {Object} options =             {} Options
   * @param  {Function} options.init a function which will be called with the registry after it is initialize.
   * @param  {Function} options.fallback called whenever an invalid lookup request returns
   *
   * @param {String} route an express or path-to-regexp style route which turns the id into metadata
   * @return {SimpleRegistry}        The SimpleRegistry
   */
  constructor(name, options = {}) {
    if (!options.route) {
      options.route = ':id(.*)'
    }

    super(name, options)

    if (options.api) {
      Object.keys(options.api).forEach(meth => {
        this[meth] = options.api[meth].bind(this)
      })
    }

    if (options.lookupMethod) {
      const me = this
      Object.assign(this, { [options.lookupMethod]: me.lookup.bind(me) })
    }

    this.attach('metadata', {
      fallback: function(id) {
        return {
          notFound: true,
          id,
        }
      },
    })
  }

  search(params = {}) {
    const reg = this

    const items = this.metadata.available.map(id => reg.meta(id)).filter(r => !r.notFound)

    return this.query(items, params)
  }

  meta(id, updateData = {}) {
    const result = this.metadata[id] || {}

    return (this.metadata[id] = {
      ...result,
      ...(this.testRoute(id) || {}),
      ...updateData,
    })
  }

  applyRoute(route, options = {}) {
    return this.router.get(route || this.options.route)
  }

  testRoute(path, route) {
    route = route || this.options.route
    return this.router.test(route)(path)
  }

  register(id, fn, metadata = {}) {
    this._register(id, fn)
    this.metadata.register(id, () => ({
      ...metadata,
      registryId: id,
      ...(this.testRoute(id) || {}),
    }))
    return this
  }
}

export default Directory

export const create = (...args) => Directory.create(...args)
