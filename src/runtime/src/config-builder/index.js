import stringify from './stringify'
import { pluralize } from '../utils/inflect'

import {
  flatten,
  cloneDeep,
  mapKeys,
  mapValues,
  reduce,
  isUndefined,
  defaults,
  uniqBy,
} from 'lodash'

export function buildConfig(options = {}) {
  const { host = this } = options

  let {
    history = host.configHistory,
    scope = this,
    baseConfig = {},
    features = {},
    reducers = {},
    presets = {},
    keyFn = host.configKeysFn || pluralize,
    onReset,
    onStash,
    historyId = 0,
  } = options

  const api = (o = {}) =>
    buildConfig.call(this, { features, presets, historyId, reducers, ...options, ...o })

  features = mapValues(features, fn => fn.bind(scope))
  presets = mapValues(presets, fn => fn.bind(scope))
  reducers = mapValues(reducers, fn => fn.bind(scope))

  const getState = () => {
    const initialState = reduce(
      features,
      (acc, feature, name) => {
        const defaultValue = feature()

        if (isUndefined(defaultValue)) {
          return acc
        }

        return {
          ...acc,
          [name]: defaultValue,
        }
      },
      {}
    )

    const state = flatten(history).reduce((acc, entry = {}) => {
      const { name, args } = entry
      const featureState = acc[name]
      const feature = features[name]

      return {
        ...acc,
        [name]: feature(featureState, ...args),
      }
    }, initialState)

    Object.defineProperty(state, 'toString', {
      value: () => stringify(state),
    })

    return state
  }

  const getConfig = (tap = options.tap) => {
    const state = getState()

    let config = reduce(
      reducers,
      (config, reducer, name) => {
        const reduced = reducer(state)
        if (isUndefined(reduced)) {
          return config
        }

        return {
          ...config,
          [name]: reduced,
        }
      },
      Object.assign({}, baseConfig)
    )

    if (typeof tap === 'function') {
      config = tap.call(scope, config, options)
    }

    Object.defineProperty(config, 'toString', {
      value: () => stringify(config),
    })

    return config
  }

  const when = (env, configure) => {
    const envs = Array.isArray(env) ? env : [env]
    const { NODE_ENV = 'development' } = process.env

    if (env === true || envs.indexOf(NODE_ENV) !== -1) {
      return configure(api({ features, reducers, history }))
    } else if (typeof env === 'function' && env(getState(), getConfig)) {
      return configure({ features, reducers, history })
    }

    return api({ features, reducers, history })
  }

  const reset = () => {
    history.length = 0
    onReset && onReset()
    return api({ features, reducers, history })
  }

  const stash = (name, shouldReset = true) => {
    onStash && onStash(name, history)
    if (!host.configStash) host.hide('configStash', {})
    host.set(['configStash', name], cloneDeep(history))

    return shouldReset ? reset() : api({ features, reducers, history })
  }

  stash.load = (name, action = 'append', keep = false) => {
    const stashed = host.get(['configStash', name], [])

    if (!keep) delete host.configStash[name]

    switch (action) {
      case 'prepend':
      case 'unshift':
        host.hide('builder', api({ features, reducers, history: [...stashed, ...history] }))
        return host.builder
      case 'replace':
      case 'reset':
        host.hide('builder', api({ features, reducers, history: stashed }))
        return host.builder
      case 'append':
      case 'push':
      default:
        host.hide('builder', api({ features, reducers, history: [...history, ...stashed] }))
        return host.builder
    }
  }

  const serialize = () => JSON.stringify(history, null, 2)

  const generateConfig = (...args) =>
    defaults(mapKeys(getConfig(...args), (v, k) => keyFn.call(host, v, k)), baseConfig)

  const builder = reduce(
    features,
    (acc, feature, name) => ({
      ...acc,
      [name]: (...args) =>
        api({
          features,
          reducers,
          history: history.concat({ historyId: (historyId = historyId + 1), args, name }),
          historyId: historyId,
        }),
    }),
    {
      getConfig: generateConfig,
      getState,
      history,
      when,
      reset,
      stash,
      serialize,
    }
  )

  return reduce(
    presets,
    (acc, preset, name) => ({
      ...acc,
      [name]: (...args) => {
        const result = preset(builder, ...args)

        return api({
          features,
          historyId: (historyId = historyId + 1),
          reducers,
          presets,
          history: uniqBy(history.concat(result.history), 'historyId'),
        })
      },
    }),
    builder
  )
}

export default buildConfig
