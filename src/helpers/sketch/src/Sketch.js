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
 *
 * The Sketch Helper provides a class which can represent a single sketch file on your system.
 * It depends on the sketchtool binary that comes with the sketchapp itself, and under the hood
 * just shells out to this command to get the data it needs.
 * Once you have loaded a sketch helper instance and built it, you will have all of the data available to you
 * that can be extracted from the sketchtool CLI, including information about the pages, artboards, and layers,
 * as well as the full JSON dump of the sketch internal object tree, which you can traverse.
 * You can use the sketch helper to generate CSS, extract assets, or whatever else you might need when trying to
 * integrate a designer's tools into your project or portfolio.
 * To use the Sketch helper in the browser, you will need to provide this data directly in your module.
 * We provide a webpack loader that will do this @skypager/helpers-sketch/sketchtool-loader.js
 * or you can use functions provided by @skypager/helpers-sketch/cli.js *
 */
export class Sketch extends Helper {
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

    /**
     * @type {MobxObservableMap}
     */
    this.state = this.runtime.mobx.observable.shallowMap(entries(this.initialState))
  }

  /**
   * Returns true after the build method is called.
   * @type {Boolean}
   */
  get isBuilt() {
    return !!this.state.get('built')
  }

  /**
   * @typedef {Object} SketchState
   * @property {Boolean} built
   * @property {Object} dump
   * @property {Array<ArtboardSnapshot>} artboards
   * @property {Array<PageMeta>} pages
   */

  /**
   * Returns a JSON snapshot of the sketch document's state.
   *
   * @type {SketchState}
   */
  get currentState() {
    return this.state.toJSON()
  }

  /**
   * Returns information about the sketch documents pages, * will only work after build method is called.
   * @type {Array<PageMeta>}
   */
  get pages() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }
    return this.currentState.pages || []
  }

  /**
   * Returns information about the sketch document's artboards.  Will only work after build method is called.
   * @type {Array<ArtboardSnapshot>}
   */
  get artboards() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }
    return this.currentState.artboards || []
  }

  /**
   * Returns information about the sketch document's artboards.  Will only work after build method is called.
   * @type {Array<LayerSnapshot>}
   */
  get layers() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }
    return this.state.get('layers') || []
  }

  /**
   * Returns raw data from the sketchtool dump about this document's shared layer styles.
   */
  get layerStyles() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }

    const { get } = this.lodash
    const dump = this.state.get('dump')

    return get(dump, 'layerStyles.objects', [])
  }

  /**
   * Returns an array of the page names defined in this sketch document.
   * @type {Array<String>}
   */
  get pageNames() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }

    const { map } = this.lodash
    return map(this.pages, 'name')
  }

  /**
   * Assuming the artboard names follow some convention where the name includes
   * a category of some sort, this will give you the values found.
   *
   * @type {Array<String>}
   */
  get artboardCategories() {
    if (!this.isBuilt) {
      throw new Error('Must call build() on this instance first')
    }

    const { uniq, map } = this.lodash
    return uniq(map(this.artboards, 'category'))
  }

  /**
   * Returns the absolute path to the sketchfile being represented by this instance.
   */
  get path() {
    return this.tryGet('sketchFile') || this.tryGet('path')
  }

  /**
   * Fetches all of the information from the sketchtool that we can, and puts this data
   * in the sketch helper's state.  Loading all of the data from sketchtool into memory,
   * and saving it in this state structure, allows us to build different data abstractions
   * from that raw data, without having to run sketchtool more often than we need to.
   *
   * @returns {Promise<SketchState>}
   */
  async build(options = {}) {
    const { pages = [] } = await this.fetch('pages', () => this.loadPages(this.path, options))

    const artboards = await this.listAllArtboards(options)
    const dump = await this.loadDump()

    this.state.merge({ built: true, dump, artboards, pages })

    if (options.includeLayers) {
      const layers = await this.listAllLayers(options)
      this.state.set('layers', layers)
    }

    return this.state.toJSON()
  }

  /**
   * Fetches the data from sketchtool or the JSON dump
   *
   * @private
   */
  async fetch(...args) {
    return fetch(this, ...args)
  }

  /**
   * @typedef {Object} ArtboardSnapshot
   * @property {String} id
   * @property {String} name the full name of the artboard as it was entered into sketch
   * @property {String} [category] if the default namePattern is used, this string will be whatever was extracted from the artboard name before the slash
   * @property {String} [artboardName] if the default namePattern is used, this string will be whatever comes after the slash in the artboard name
   * @property {Bounds} rect
   * @property {Bounds} trimmed
   * @property {String} pageId
   * @property {String} pageName
   * @property {String} pageBounds
   */

  /**
   * Returns a normalized array of objects representing each of the artboards in the sketch file.
   *
   * @param {Object} options
   * @param {String} [options.namePattern=':category/:artboardName'] namePattern expresses the parts of the artboard name which are used to categorize / name the artboard.
   *                                                                 these parts of the artboard name will be attributes on the returned object.
   * @returns {Promise<ArtboardSnapshot>}
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
   * @typedef {Object} LayerSnapshot
   * @property {Array<LayerMeta>} layers
   * @property {String} id
   * @property {String} name
   * @property {String} category
   * @property {String} layerName
   * @property {String} pageId
   * @property {String} pageName
   * @property {String} pageBounds
   * @property {Bounds} rect
   * @property {Bounds} relative
   * @property {Bounds} influence
   * @property {Object<String,LayerMeta>} children
   */

  /**
   * Returns an flatten array of metadata objects about all of the layers.
   *
   * Will attempt to parse category / layerName from the layer name by treating each layer name
   * as if it follows a document wide convention that can be expressed with a regexp style route pattern
   * e.g. :category/:layerName.
   *
   * Returning the data in this way, and building attributes from the layer names, provides a searchable list of objects
   * which have a normalized structure.  The category / layerName can be used to differentiate these objects according to the
   * design organization scheme represented in the particular sketchfile.
   *
   * @param {Object} options
   * @param {String} [options.namePattern=':category/:layerName'] namePattern expresses the naming convention for how layers are named,
   *                                                              and which part of the name means what assuming there is punctuation like a slash
   * @returns {Promise<LayerSnapshot>}
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

  /**
   * @typedef {Object<String,Object>} ArtboardSummary
   * @property {String} name
   * @property {ArtboardSummary} [artboards]
   */

  /**
   * @typedef {Object} SketchMeta
   * @property {String} commit
   * @property {Object<String, ArtboardSummary>} pagesAndArtboards
   * @property {Number} version
   * @property {Array<String>} fonts
   * @property {Number} compatibilityVersion
   * @property {String} app
   * @property {Number} autosaved
   * @property {String} variant
   * @property {CreatedMeta} created
   * @property {Array<String>} saveHistory
   * @property {Number} build
   */

  /**
   * Loads the artboard objects from the sketch file.
   *
   * @param {String} [pathToSketchFile=this.path]
   * @param {Object} [options={}]
   *
   * @returns {Promise<SketchMeta>}
   */
  async loadMetadata(pathToSketchFile = this.path, options = {}) {
    const metadata = await viewSketchMetadata(pathToSketchFile, options)
    return metadata
  }

  /**
   * @typedef {Object} ArtboardMeta
   * @property {String} id
   * @property {String} name
   * @property {String} [bounds]
   * @property {Array<ArtboardMeta>} artboards
   * @property {Bounds} [trimmed]
   * @property {Bounds} [rect]
   */

  /**
   * @typedef {Object} ArtboardList
   * @property {Array<ArtboardMeta>} pages
   */

  /**
   * Loads the artboard objects from the sketch file.
   *
   * @param {String} [pathToSketchFile=this.path]
   * @param {Object} [options={}]
   *
   * @returns {Promise<ArtboardList>}
   */
  async loadArtboards(pathToSketchFile = this.path, options = {}) {
    const artboards = await listSketchArtboards(pathToSketchFile, options)

    if (options.cache) {
      this.cacheWrite({ artboards })
    }

    return artboards
  }

  /**
   * @typedef {Object} Bounds
   * @property {Number} x
   * @property {Number} y
   * @property {Number} width
   * @property {Number} height
   */

  /**
   * @typedef {Object} LayerMeta
   * @property {String} id
   * @property {String} name
   * @property {String} [bounds]
   * @property {Array<LayerMeta>} layers
   * @property {Bounds} [trimmed]
   * @property {Bounds} [rect]
   * @property {Bounds} [relative]
   * @property {Bounds} [influence]
   */

  /**
   * @typedef {Object} LayersList
   * @property {Array<LayerMeta>} pages
   */

  /**
   * Loads the page objects from the sketch file.
   *
   * @param {String} [pathToSketchFile=this.path]
   * @param {Object} [options={cache: false}]
   * @param {Boolean} [options.cache=false] cache the output
   *
   * @returns {Promise<LayersList>}
   */
  async loadLayers(pathToSketchFile = this.path, options = {}) {
    const layers = await listSketchLayers(pathToSketchFile, options)

    if (options.cache) {
      this.cacheWrite({ layers })
    }

    return layers
  }

  /**
   * @typedef {Object} PageMeta
   * @property {String} name
   * @property {String} id
   * @property {String} bounds
   */

  /**
   * @typedef {Object} PagesList
   * @property {Array<PageMeta>} pages
   */

  /**
   * Loads the page objects from the sketch file.
   *
   * @param {String} [pathToSketchFile=this.path]
   * @param {Object} [options={}]
   *
   * @returns {Promise<PagesList>}
   */
  async loadPages(pathToSketchFile = this.path, options = {}) {
    const pages = await listSketchPages(pathToSketchFile, options)
    return pages
  }

  /**
   * Loads the sketchtool JSON dump for the given sketchfile.
   *
   * @param {String} [pathToSketchFile=this.path]
   * @param {Object} [options={}]
   */
  async loadDump(pathToSketchFile = this.path, options = {}) {
    const layers = await viewSketchDump(pathToSketchFile, options)
    return layers
  }

  /**
   * When you say runtime.use(require('@skypager/helpers-sketch')) it passes
   * an instance of the runtime to this function, so we can attach the helper
   * registry and factory function to the runtime.
   *
   * @private
   */
  static attach(runtime, options = {}) {
    Helper.registerHelper('sketch', () => Sketch)

    Helper.attach(runtime, Sketch, {
      registry: Helper.createContextRegistry('sketches', {
        context: Helper.createMockContext(),
        api: {
          async discover() {
            await runtime.fileManager.startAsync()
            const sketchFiles = runtime.fileManager.chains
              .patterns('**/*.sketch')
              .map(({ relative, path }) => ({ relative, path }))
              .value()

            return sketchFiles.map(({ relative, path }) => {
              const name = relative.replace('.sketch', '')
              runtime.sketches.register(name, () => ({ path }))
              return name
            })
          },
        },
      }),
      lookupProp: 'sketch',
      registryProp: 'sketches',
      ...options,
    })

    return runtime
  }
}

export default Sketch

export function attach(...args) {
  return Sketch.attach(...args)
}

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

/**
 * @typedef {Object} MobxObservableMap
 * @property {Function} set
 * @property {Function} get
 * @property {Function} keys
 * @property {Function} values
 * @property {Function} entries
 * @property {Function} has
 * @property {Function} delete
 * @property {Function} toJSON
 * @property {Function} toJS
 */
