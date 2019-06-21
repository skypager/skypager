import runtime from '@skypager/node'
import { Helper } from '@skypager/runtime'
import { google } from 'googleapis'

/**
 * The GoogleDoc Helper represents an individual google document stored on google drive, as a stateful
 * javascript module.  You can discover all of the google documents available at runtime, or you can
 * have a module file in your project that exports a property documentId that is the unique id from the URL
 * for the google document you want to work with.
 *
 * As an individual module instance, you can read and write to the document and analyze its AST, and select various
 * elements from the document using semantic patterns, headings , etc.
 *
 * The GoogleDoc Helper attaches a registry of many possible google document instances available to you.  This allows you to
 * join the documents together and aggregate information from them all in one place.  Use it to generate a static website,
 * for example.
 *
 * If you use google document templates that have common headings, you can build modules for working with all of the documents
 * which follow the format.
 *
 * Use this class to build a content object model, by combining content from a collection of google documents with javascript modules
 * that work with their contents.
 *
 */
export class GoogleDoc extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false
  static google = google

  initialState = {}

  /**
   * This lifecycle hook gets automatically called whenever you create an instance of the GoogleDoc Helper,
   * which is typically done using the `runtime.googleDoc` factory function.
   *
   * As part of the initialize hook, we load the document skeleton from the google API,
   * and call an optional initialize function if one was passed as options or registered as a provider module
   * with the googleDocs registry.
   */
  async initialize() {
    const { doc = this.options.doc } = this.provider

    if (doc) {
      this.state.set('doc', doc)
    } else {
      Promise.resolve(this.load({ remote: true })).catch(error => {
        this.state.set('docLoadError', error)
      })
    }

    const { initialize = this.provider.initialize } = this.options

    if (typeof initialize === 'function') {
      await initialize.call(this, this.options, this.context)
    }
  }

  /**
   * Returns the revisionId of this document
   * @type {String}
   */
  get revisionId() {
    return this.get('doc.revisionId')
  }

  /**
   * Returns the documentId of this document. This is the unique component of the URL for this google document.
   * @type {String}
   */
  get documentId() {
    return this.tryGet('documentId', this.get('doc.documentId'))
  }

  /**
   * Returns the title of the Google Document Drive File.
   *
   * @type {String}
   *
   */
  get title() {
    return this.tryGet('title', this.get('doc.title', this.name))
  }

  /**
   * Returns the raw GoogleDocument wrapper
   * @type {Object}
   */
  get doc() {
    return this.get('currentState.doc', DEFAULT_DOC)
  }

  /**
   * Returns the latest time the document was loaded into memory for this instance.
   * @type {Number}
   */
  get loadedAt() {
    return this.state.get('loadedAt')
  }

  /**
   * Returns the content AST nodes for this document.
   * @type {Array}
   */
  get contentNodes() {
    return this.get('doc.body.content', [])
  }

  /**
   * Returns true if there was an error loading the document from the Google API
   * @type {Boolean}
   */
  get hasLoadError() {
    return this.state.has('docLoadError')
  }

  /**
   * Returns the error that was thrown when you attempted to load the document.
   * @type {Error}
   */
  get loadError() {
    return this.state.get('docLoadError')
  }

  /**
   * Returns the stringified contents of the paragraph nodes in the document.
   * @returns {Array<String>}
   */
  get paragraphContents() {
    return this.paragraphNodes.map(({ paragraph }) => {
      const { elements = [] } = paragraph
      return elements.reduce((memo, element) => {
        if (element.textRun && element.textRun.content) {
          return `${memo}${element.textRun.content}`
        } else {
          return memo
        }
      }, ``)
    })
  }

  /**
   * Returns the stringified contents of the document's headings.
   *
   * @type {Array<String>}
   */
  get headingContents() {
    return this.headingNodes.map(({ paragraph }) => {
      const { elements = [] } = paragraph
      return elements.reduce((memo, element) => {
        if (element.textRun && element.textRun.content) {
          return `${memo}${element.textRun.content}`
        } else {
          return memo
        }
      }, ``)
    })
  }

  /**
   * Returns the paragraph AST nodes from the document
   * @type {Array}
   */
  get paragraphNodes() {
    return this.contentNodes.filter(
      node => node.paragraph && node.paragraph.elements && node.paragraph.elements.length
    )
  }

  /**
   * Returns the heading AST nodes from the document.
   * @type {Array}
   */
  get headingNodes() {
    return this.paragraphNodes.filter(
      ({ paragraph }) => paragraph && paragraph.paragraphStyle && paragraph.paragraphStyle.headingId
    )
  }

  /**
   * Returns the table AST nodes from the document.
   * @type {Array}
   */
  get tableNodes() {
    return this.contentNodes.filter(node => node.table)
  }

  /**
   * Returns the list AST nodes from the document.
   * @type {Array}
   */
  get lists() {
    return this.get('doc.lists', {})
  }

  /**
   * Returns an array of content element nodes from the document headings.
   * @type {Array}
   */
  get headingElements() {
    return this.headingNodes.map(({ paragraph }) => paragraph.elements || [])
  }

  /**
   * Returns the an array of paragraph content element nodes from the document paragraphs.
   * @type {Array}
   */
  get paragraphElements() {
    return this.paragraphNodes.map(({ paragraph }) => paragraph.elements || [])
  }

  /**
   * Returns the documents stylesheet
   * @type {Object}
   *
   */
  get style() {
    return this.get('doc.documentStyle', DEFAULT_DOCUMENT_STYLE)
  }

  /**
   * Returns an object of style rules, keyed by the name of the rule.
   * @type {Object<String,Object>}
   */
  get namedStyles() {
    const { keyBy } = this.lodash
    const styles = this.get('doc.namedStyles.styles', [])
    return keyBy(styles, 'namedStyleType')
  }

  /**
   * Loads the document data from Google's API and stores it in the local helper instance's state.
   *
   * @param {Object} options
   * @param {String} [options.path] if you want to load from a JSON dump instead of Google Drive
   * @param {Boolean} [options.remote=true] if you want to load remotely from google drive.  pass false if you're passing a path.
   */
  async load({ remote = true, path = undefined, ...rest } = {}) {
    if (path) {
      const doc = await this.runtime.fsx.readJsonAsync(this.runtime.resolve(path))
      this.state.merge({ doc, loadedAt: new Date() })
      return doc
    } else if (remote) {
      return this.loadRemote(rest)
    }
  }

  /**
   * Dump the JSON AST contents to disk somewhere.
   * @param {String} outputPath
   * @param {Boolean} [prettify=true] whether to include whitespace in the JSON output
   */
  async dump(outputPath, prettify = true) {
    const { runtime } = this
    const { dirname } = runtime.pathUtils
    const { writeFileAsync, mkdirpAsync } = runtime.fsx

    outputPath = runtime.resolve(outputPath || `${this.name}.json`)

    const folder = dirname(outputPath)

    await mkdirpAsync(folder)
    await writeFileAsync(
      outputPath,
      prettify ? JSON.stringify(this.doc, null, 2) : JSON.stringify(this.doc)
    )

    return this.doc
  }

  async loadRemote(options = {}) {
    const { documentId } = this
    const docs = this.runtime.google.service('docs', { version: 'v1' })
    const doc = await docs.documents.get({ documentId }).then(r => r.data)

    this.state.merge({
      loadedAt: new Date(),
      doc,
    })

    return doc
  }

  async reload(options = {}) {
    return this.load({ refresh: true })
  }
}

export async function discover(host = runtime, options = {}) {
  if (!host.google) {
    host.feature('google').enable(options)
  }

  await host.google.whenReady()

  const records = await host.google.listDocuments({
    recursive: true,
    ...options,
  })
  const { kebabCase, camelCase } = host.stringUtils

  return records.map(record => {
    const id = camelCase(kebabCase(record.title.replace(/\W/g, '')))
    host.googleDocs.register(id, () => record)
    return id
  })
}

export function attach(host = runtime) {
  try {
    Helper.registerHelper('googleDocs', () => GoogleDoc)
    GoogleDoc.attach(host, GoogleDoc, {
      registry: Helper.createContextRegistry('googleDocs', {
        context: Helper.createMockContext({}),
      }),
    })

    host.googleDocs.applyInterface(
      {
        discover,
      },
      { partial: [host], right: false, configurable: true }
    )

    return
  } catch (error) {
    host.setState({ googleDocHelpersError: error })
    throw error
  }

  return host
}

export const DEFAULT_DOCUMENT_STYLE = {
  background: {
    color: {},
  },
  pageNumberStart: 1,
  marginTop: {
    magnitude: 72,
    unit: 'PT',
  },
  marginBottom: {
    magnitude: 72,
    unit: 'PT',
  },
  marginRight: {
    magnitude: 72,
    unit: 'PT',
  },
  marginLeft: {
    magnitude: 72,
    unit: 'PT',
  },
  pageSize: {
    height: {
      magnitude: 792,
      unit: 'PT',
    },
    width: {
      magnitude: 612,
      unit: 'PT',
    },
  },
}

const DEFAULT_DOC = {
  title: '',
  body: {
    content: [],
  },
  documentStyle: DEFAULT_DOCUMENT_STYLE,
  inlineObjects: {},
  lists: {},
  documentId: '',
}
