import Qbus from 'qbus'

function hide(target, property, value, configurable = true) {
  Object.defineProperty(target, property, { value, configurable: !!configurable, enumerable: false })
  return target
}

export function attachTo(host, options = {}) {
  const emitter = new Qbus()

  const { configurable = true } = options

  hide(host, "emitter", emitter, configurable)
  hide(host, "on", emitter.on.bind(emitter), configurable)
  hide(host, "addListener", emitter.on.bind(emitter), configurable)
  hide(host, "once", emitter.once.bind(emitter), configurable)
  hide(host, "off", emitter.off.bind(emitter), configurable)
  hide(host, "removeAllListeners", emitter.off.bind(emitter), configurable)
  hide(host, "emit", emitter.emit.bind(emitter), configurable)
  hide(host, "trigger", emitter.emit.bind(emitter), configurable)

  return emitter
}

export const attachEmitter = attachTo

export const attach = attachTo
