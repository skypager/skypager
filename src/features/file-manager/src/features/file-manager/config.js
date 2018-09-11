export function configFeatures() {
  const fileManager = this
  const { isEmpty, isArray, isFunction, isObject, isString } = skypager.lodash

  return {
    baseFolder(existing = skypager.cwd, arg) {
      if (arguments.length === 0) return existing

      if (arg) {
        return skypager.resolve(arg)
      } else {
        return existing
      }
    },

    sourceFolder(existing, arg, options = {}) {
      if (arguments.length === 0) return existing
    },

    outputFolder(existing, arg, options = {}) {
      if (arguments.length === 0) return existing
    },

    extension(existing, extension, handler) {
      if (arguments.length === 0) return

      existing = existing || {}

      if (!typeof handler === "function" && !typeof extension === "string") {
        return existing
      }

      extension = extension.replace(/^\./, "")

      return {
        ...existing,
        [extension]: [
          ...(existing[extension] || []),
          function(next, done) {
            const file = this
            return handler.call(fileManager, file, next, done)
          },
        ],
      }
    },

    memory(existing = false, arg) {
      if (arguments.length === 0) return existing
      return arg !== false
    },

    ignore(existing = [], ...args) {
      if (isEmpty(arguments)) return []
      return [...existing, ...args]
    },

    route(existing = {}, routePattern, handler) {
      if (arguments.length === 0) return

      if (!existing[routePattern]) {
        existing[routePattern] = []
      }

      if (isFunction(handler)) {
        existing[routePattern].push(handler)
      }

      return existing
    },
  }
}

export function configReducers() {
  const feature = this
  const { runtime } = feature

  return {
    baseFolder(state) {
      return runtime.resolve(state.baseFolder || feature.get("options.cwd", runtime.cwd))
    },

    ignore(state = {}) {
      return state.ignore
    },

    extensions(state = {}) {
      return state.extension
    },

    memory(state = {}) {
      return state.memory || false
    },

    route(state = {}) {
      return state.route
    },
  }
}
