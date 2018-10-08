export const shortcut = 'ipc'

export const featureMethods = ['listen', 'send']

export const featureMixinOptions = {
  insertOptions: false,
  partial: [],
}

export function featureWasEnabled() {}

export function send(receiver = global, channel, data = {}) {
  const { isFunction } = this.lodash

  if (!isFunction(receiver.postMessage)) {
    throw new Error('Receiver does not have a postMessage function.')
  }

  receiver.postMessage({ channel, ...data }, global.origin)
}

export function listen(channel, handler, condition) {
  const { isFunction } = this.lodash

  if (typeof window !== 'undefined') {
    const fn = ({ origin, source, data }) => {
      if (isFunction(condition) && !!condition({ origin, source, data })) {
        return
      }

      console.log('Received IPC Message', data, { origin, source })

      if (data.channel === channel) {
        Promise.resolve(handler({ channel, source, data, origin }))
      }
    }

    window.addEventListener('message', fn)

    return () => window.removeEventListener('message', fn)
  }
}
