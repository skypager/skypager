import runtime, { Helper } from '@skypager/node'
import { google } from 'googleapis'

export class GoogleDoc extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false
  static google = google

  initialState = {}

  initialize() {
    const { doc = this.options.doc } = this.provider

    if (doc) {
      this.state.set('doc', doc)
    } else {
      Promise.resolve(this.load({ remote: true })).catch(error => {
        this.state.set('docLoadError', error)
      })
    }
  }

  get revisionId() {
    return this.get('doc.revisionId')
  }

  get documentId() {
    return this.tryGet('documentId', this.get('doc.documentId'))
  }

  get title() {
    return this.tryGet('title', this.get('doc.title', this.name))
  }

  get doc() {
    return this.get('currentState.doc', DEFAULT_DOC)
  }

  get loadedAt() {
    return this.state.get('loadedAt')
  }

  get contentNodes() {
    return this.get('doc.body.content', [])
  }

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

  get paragraphNodes() {
    return this.contentNodes.filter(
      node => node.paragraph && node.paragraph.elements && node.paragraph.elements.length
    )
  }

  get headingNodes() {
    return this.paragraphNodes.filter(
      ({ paragraph }) => paragraph && paragraph.paragraphStyle && paragraph.paragraphStyle.headingId
    )
  }

  get tableNodes() {
    return this.contentNodes.filter(node => node.table)
  }

  get lists() {
    return this.get('doc.lists', {})
  }

  get headingElements() {
    return this.headingNodes.map(({ paragraph }) => paragraph.elements || [])
  }

  get paragraphElements() {
    return this.paragraphNodes.map(({ paragraph }) => paragraph.elements || [])
  }

  get style() {
    return this.get('doc.documentStyle', DEFAULT_DOCUMENT_STYLE)
  }

  get namedStyles() {
    const { keyBy } = this.lodash
    const styles = this.get('doc.namedStyles.styles', [])
    return keyBy(styles, 'namedStyleType')
  }

  async load({ remote = true, path = undefined, ...rest } = {}) {
    if (remote) {
      return this.loadRemote(rest)
    } else if (path) {
      const doc = await this.runtime.fsx.readJsonAsync(this.runtime.resolve(path))
      this.state.merge({ doc, loadedAt: new Date() })
      return doc
    }
  }

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
