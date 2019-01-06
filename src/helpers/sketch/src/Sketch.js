import { Helper } from '@skypager/node'
import {
  listSketchArtboards,
  listSketchPages,
  listSketchLayers,
  viewSketchDump,
  viewSketchMetadata,
} from './cli'
import { route } from '@skypager/runtime/lib/utils/router'

/**
 * The Sketch Helper is used to work with modules that are created from .sketch files using
 * the sketchtool CLI that comes with SketchApp.  Our wrapper around sketchtool provides an easy
 * way of extracting different slices of data from a .sketch file:
 *
 *  - Pages
 *  - Artboards
 *  - Layers
 *  - Metadata
 *
 * You can see examples in test/fixtures of what sketchtool creates for a given sketch file.
 *
 * An instance of the Sketch class, when running on node, can lazily load any one of these sketchtool views as needed.
 *
 * The only requirements are a path, and that sketchtool is available on your system.
 *
 * To use the Sketch helper in the browser, you will need to provide this data directly in your module.
 * We provide a webpack loader that will do this @skypager/helpers-sketch/sketchtool-loader.js
 * or you can use functions provided by @skypager/helpers-sketch/cli.js
 */

const privates = new WeakMap()

const fetch = async (instance, key, onMiss) => {
  let val = privates.get({ instance, key })

  if (val) {
    return val
  }

  val = await onMiss()

  privates.set({ instance, key }, val)

  return val
}

export default class Sketch extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false

  initialState = {
    pages: [],
    artboards: [],
    layers: [],
  }

  initialize() {
    const { entries } = this.lodash
    this.state = this.runtime.mobx.observable.shallowMap(entries(this.initialState))
  }

  get isBuilt() {
    return !!this.state.get('built')
  }

  get pages() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }
    return this.state.get('pages') || []
  }

  get artboards() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }
    return this.state.get('artboards') || []
  }

  get layers() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }
    return this.state.get('layers') || []
  }

  get pageNames() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }

    const { map } = this.lodash
    return map(this.pages, 'name')
  }

  get artboardCategories() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }

    const { uniq, map } = this.lodash
    return uniq(map(this.artboards, 'category'))
  }

  get path() {
    return this.tryGet('sketchFile') || this.tryGet('path')
  }

  async build(options = {}) {
    const { pages = [] } = await this.fetch('pages', () => this.loadPages(this.path, options))

    const layers = await this.listAllLayers(options)
    const artboards = await this.listAllArtboards(options)

    this.state.merge({ built: true, layers, artboards, pages })

    return this.state.toJSON()
  }

  async fetch(...args) {
    return fetch(this, ...args)
  }

  /**
   * The way sketchtool outputs artboard metadata is deeply nested
   * within an array of page objects.  This method flattens all of the artboards
   * into a single array, with references to the the parent page attributes
   */
  async listAllArtboards(options = {}) {
    const { flatten, castArray } = this.lodash
    const { pages = [] } = await this.fetch('artboards', () =>
      this.loadArtboards(this.path, options)
    )

    const { namePattern = ':category/:artboardName' } = options

    if (!namePattern || !namePattern.match(':artboardName')) {
      throw new Error('Name pattern must have a :artboardName variable')
    }

    const artboardAttributes = name => route(namePattern)(name)

    const allArtboards = pages.map(page => {
      return castArray(page.artboards)
        .filter(Boolean)
        .map(artboard => {
          const attributes = artboardAttributes(artboard.name)

          return {
            ...artboard,
            ...attributes,
            pageId: page.id,
            pageName: page.name,
            pageBounds: page.bounds,
          }
        })
    })

    return flatten(allArtboards)
  }

  /**
   * The way sketchtool outputs layer metadata is deeply nested
   * within an array of page objects.  This method flattens all of the top level layers
   * into a single array, with references to the the parent page attributes
   */
  async listAllLayers(options = {}) {
    const { omit, keyBy, flatten, castArray, upperFirst } = this.lodash
    const { camelCase } = this.runtime.stringUtils
    const { pages = [] } = await this.fetch('layers', () => this.loadLayers(this.path, options))
    const { namePattern = ':category/:layerName' } = options

    if (!namePattern || !namePattern.match(':layerName')) {
      throw new Error('Name pattern must have a :layerName variable')
    }

    const layerAttributes = name => route(namePattern)(name)

    const buildChildLayers = (layers = []) => {
      layers = castArray(layers).filter(Boolean)
      return keyBy(layers, v => upperFirst(camelCase(v.name)))
    }

    const allLayers = pages.map(page => {
      return castArray(page.layers)
        .filter(Boolean)
        .map(layer => {
          const children = buildChildLayers(layer.layers)
          const attributes = layerAttributes(layer.name)

          return {
            ...layer,
            ...attributes,
            children: omit(children, attributes.layerName || 'layerName'),
            pageId: page.id,
            pageName: page.name,
            pageBounds: page.bounds,
          }
        })
    })

    return flatten(allLayers)
  }
  /*
    Sketch Metadata Loader Functions

    The load* functions interface directly with the sketchtool cli commands
    for listing layers, artboards, pages, etc.  Each of these functions can be used
    to generate more fine grained detail about the sketch document.
  */

  /**
   * Sketch Metadata
   *
   * Provides very top level information about the structure of the sketchfile
   *
   * pagesAndArtboards - a list of the pages, their names and ids, along with their artboards, names and ids
   * fonts - the fonts used
   */
  async loadMetadata(pathToSketchFile = this.path, options = {}) {
    const metadata = await viewSketchMetadata(pathToSketchFile, options)
    return metadata
  }

  async loadArtboards(pathToSketchFile = this.path, options = {}) {
    const artboards = await listSketchArtboards(pathToSketchFile, options)

    if (options.cache) {
      this.cacheWrite({ artboards })
    }

    return artboards
  }

  async loadLayers(pathToSketchFile = this.path, options = {}) {
    const layers = await listSketchLayers(pathToSketchFile, options)

    if (options.cache) {
      this.cacheWrite({ layers })
    }

    return layers
  }

  async loadPages(pathToSketchFile = this.path, options = {}) {
    const layers = await listSketchPages(pathToSketchFile, options)
    return layers
  }

  async loadDump(pathToSketchFile = this.path, options = {}) {
    const layers = await viewSketchDump(pathToSketchFile, options)
    return layers
  }

  static attach(runtime, options = {}) {
    Helper.registerHelper('sketch', () => Sketch)

    Helper.attach(runtime, Sketch, {
      registry: Helper.createContextRegistry('sketches', {
        context: Helper.createMockContext(),
      }),
      lookupProp: 'sketch',
      registryProp: 'sketches',
      ...options,
    })

    return runtime
  }
}

export function attach(...args) {
  return Sketch.attach(...args)
}
