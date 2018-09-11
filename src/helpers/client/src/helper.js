/**
 * @namespace ClientHelper
 */
import axios from 'axios'

export function attach(runtime) {
  const { Helper } = runtime

  if (!runtime.has('axios')) {
    runtime.hide('axios', axios)
  }

  class Client extends Helper {
    static isCacheable = true
    static allowAnonymousProviders = true
    static strictMode = false
    static axios = axios

    static attach(host, options = {}) {
      return Helper.attach(host, Client, {
        registry: Helper.createContextRegistry('clients', {
          context: Helper.createMockContext(),
        }),
        ...options,
      })
    }

    initialize() {
      try {
        if (this.tryGet('initialize')) {
          const initializer = this.tryGet('initialize')
          initializer.call(this, this.options, this.context)
        } else {
          this.lazy('client', () => this.createProviderClient(this.options, this.context))
        }
      } catch (error) {
        this.initializationError = error
      }

      try {
        this.applyInterface(this.interface, {
          insertOptions: false,
          partial: [],
          scope: this,
          ...this.tryResult('interfaceOptions', {}),
        })
      } catch (error) {
        this.interfaceError = error
      }
    }

    get interface() {
      return this.tryResult('interface', () => {
        const methods = this.tryResult('methods', () => this.tryResult('interfaceMethods')) || []
        return this.chain
          .plant(methods)
          .keyBy(val => val)
          .mapValues(fnName => this.tryGet(fnName))
          .pickBy(fn => typeof fn === 'function')
          .value()
      })
    }

    get baseUrl() {
      return this.tryResult('baseUrl') || this.tryResult('baseURL')
    }

    get baseURL() {
      return this.baseUrl
    }

    get axios() {
      return axios
    }

    fetch(...args) {
      return this.client(...args)
    }

    GET(...args) {
      return this.client.get(...args)
    }
    PUT(...args) {
      return this.client.put(...args)
    }
    PATCH(...args) {
      return this.client.patch(...args)
    }
    DELETE(...args) {
      return this.client.delete(...args)
    }
    OPTIONS(...args) {
      return this.client.options(...args)
    }
    POST(...args) {
      return this.client.post(...args)
    }

    createProviderClient(options = {}) {
      const createClient = this.tryGet('createClient') || (() => this.createAxiosClient(options))
      return createClient.call(this, options)
    }

    createAxiosClient(options = {}) {
      const o = this.lodash.pick(
        {
          baseURL: this.baseURL,
          ...this.options,
          ...this.get('options.axios', {}),
          ...this.get('options.axiosOptions', {}),
          ...options,
        },
        'adapter',
        'transformRequest',
        'transformResponse',
        'timeout',
        'xsrfCookieName',
        'xsrfHeaderName',
        'maxContentLength',
        'validateStatus',
        'headers',
        'baseURL'
      )

      return axios.create(o)
    }

    headers(applyHeaders = {}) {
      const { mapValues, omit } = this.lodash

      const { client } = this

      mapValues(omit(applyHeaders, 'common', 'get', 'post', 'put'), (value, header) => {
        client.defaults.headers.common[header] = value
      })

      mapValues(applyHeaders.common || {}, (value, header) => {
        client.defaults.headers.common[header] = value
      })

      mapValues(applyHeaders.post || {}, (value, header) => {
        client.defaults.headers.post[header] = value
      })

      mapValues(applyHeaders.put || {}, (value, header) => {
        client.defaults.headers.put[header] = value
      })

      mapValues(applyHeaders.get || {}, (value, header) => {
        client.defaults.headers.get[header] = value
      })
    }
  }

  runtime.setState({ typeofClient: typeof Client })

  try {
    Helper.registerHelper('client', () => Client)

    Helper.attach(runtime, Client, {
      registry: Helper.createContextRegistry('clients', {
        context: Helper.createMockContext(),
      }),
      registryProp: 'clients',
      lookupProp: 'client',
    })
  } catch (error) {
    runtime.setState({ error: error })
  }

  return runtime
}
