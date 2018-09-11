import opn from 'opn'

export const featureMethods = ['open', 'openInBrowser']

export const createGetter = 'opener'

export const featureMixinOptions = {
  partial: [],
  injectOptions: false,
}

export function open(path, options = {}) {
  return opn(path, options)
}

export function openInBrowser(url, options = {}) {
  return opn(url, options)
}
