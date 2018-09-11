export const shortcut = 'autoDiscovery'

export const featureMethods = [
  'discover',
  'discoverFeatures',
  'discoverProjectTypes',
  'discoverHelpers',
  'discoverDocumentTypes',
  'discoverApps',
  'discoverRuntimes',
  'registerProjectTypes',
  'registerDocumentTypes',
  'getPackageFinder',
  'find',
]

export function observables() {
  return {
    apps: ['shallowMap', {}],
    documentTypes: ['shallowMap', {}],
    features: ['shallowMap', {}],
    helpers: ['shallowMap', {}],
    projectTypes: ['shallowMap', {}],
    runtimes: ['shallowMap', {}],
    discoveredApps: [
      'computed',
      function() {
        return Object.keys(this.apps.toJSON())
      },
    ],
    discoveredHelpers: [
      'computed',
      function() {
        return Object.keys(this.helpers.toJSON())
      },
    ],
    discoveredRuntimes: [
      'computed',
      function() {
        return Object.keys(this.runtimes.toJSON())
      },
    ],
    discoveredProjectTypes: [
      'computed',
      function() {
        return Object.keys(this.projectTypes.toJSON())
      },
    ],
    discoveredDocumentTypes: [
      'computed',
      function() {
        return Object.keys(this.documentTypes.toJSON())
      },
    ],
    discoveredFeatures: [
      'computed',
      function() {
        return Object.keys(this.features.toJSON())
      },
    ],
  }
}

export function getPackageFinder() {
  return this.runtime.packageFinder
}

export function find(...args) {
  return this.packageFinder.find(...args)
}

export async function discover(options = {}) {
  await this.discoverApps()
  await this.discoverDocumentTypes()
  await this.discoverFeatures()
  await this.discoverHelpers()
  await this.discoverProjectTypes()
  await this.discoverRuntimes()

  return this
}

export async function registerDocumentTypes(options = {}) {
  const { runtime, documentTypes } = this

  if (!runtime.documentTypes) {
    throw new Error(`The document types helper has not been loaded on this runtime`)
  }

  documentTypes.entries().forEach(([id, data]) => {
    if (runtime.documentTypes.available.indexOf(id) === -1) {
      runtime.documentTypes.register(id, () => __non_webpack_require__(data.file.dirname))
    }
  })

  return this
}

export async function registerProjectTypes(options = {}) {
  const { runtime, projectTypes } = this

  if (!runtime.projectTypes) {
    throw new Error(`The project types helper has not been loaded on this runtime`)
  }

  projectTypes.entries().forEach(([id, data]) => {
    if (runtime.projectTypes.available.indexOf(id) === -1) {
      runtime.projectTypes.register(id, () => __non_webpack_require__(data.file.dirname))
    }
  })

  return this
}

export async function discoverDocumentTypes(options = {}) {
  const { prefix = 'skypager-document-types-' } = options
  const documentTypes = await this.find(new RegExp(prefix), { parse: 'matches' })

  documentTypes.forEach(documentType => {
    const id = documentType.name.replace(prefix, '')
    this.documentTypes.set(id, documentType)
  })

  return this.documentTypes.toJSON()
}

export async function discoverProjectTypes(options = {}) {
  const { prefix = 'skypager-project-types-' } = options
  const projectTypes = await this.find(new RegExp(prefix), { parse: 'matches' })

  projectTypes.forEach(projectType => {
    const id = projectType.name.replace(prefix, '')
    this.projectTypes.set(id, projectType)
  })

  if (options.register !== false) {
    await this.registerProjectTypes()
  }

  return this.projectTypes.toJSON()
}

export async function discoverHelpers(options = {}) {
  const { prefix = 'skypager-helpers-' } = options
  const helpers = await this.find(new RegExp(prefix), { parse: 'matches' })

  helpers.forEach(helper => {
    const id = helper.name.replace(prefix, '')
    this.helpers.set(id, helper)
  })

  return this.helpers.toJSON()
}

export async function discoverFeatures(options = {}) {
  const { prefix = 'skypager-features-' } = options
  const features = await this.find(new RegExp(prefix), { parse: 'matches' })

  features.forEach(feature => {
    const id = feature.name.replace(prefix, '')
    this.features.set(id, feature)
  })

  return this.features.toJSON()
}

export async function discoverApps(options = {}) {
  const { prefix = 'skypager-apps-' } = options
  const apps = await this.find(new RegExp(prefix), { parse: 'matches' })

  apps.forEach(app => {
    const id = app.name.replace(prefix, '')
    this.apps.set(id, app)
  })

  return this.apps.toJSON()
}

export async function discoverRuntimes(options = {}) {
  const { prefix = 'skypager-runtimes-' } = options
  const runtimes = await this.find(new RegExp(prefix), { parse: 'matches' })

  runtimes.forEach(runtime => {
    const id = runtime.name.replace(prefix, '')
    this.runtimes.set(id, runtime)
  })

  return this.runtimes.toJSON()
}
