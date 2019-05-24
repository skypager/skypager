import { Feature } from '@skypager/runtime'
/**
import 'brace/ext/language_tools'
import 'brace/mode/jsx'
import 'brace/mode/css'
import 'brace/mode/markdown'
import 'brace/mode/javascript'
import 'brace/mode/sh'
import 'brace/mode/html'
import 'brace/theme/tomorrow'
import 'brace/theme/vibrant_ink'
import 'brace/theme/dracula'
*/

export default class Editor extends Feature {
  static shortcut = 'editor'

  get assetLoader() {
    const assetLoader = this.runtime.feature('asset-loaders')
    return assetLoader
  }

  syncWithDocument(editorComponent, aceEditor, documentHelper) {
    const { get } = this.lodash
    this.makeDocumentEditable(documentHelper)

    const { props } = editorComponent
    const lineNumber = get(props, 'data-line-number')

    if (lineNumber) {
      documentHelper.editors.set(lineNumber, {
        ...(documentHelper.editors.get(lineNumber) || {}),
        editor: aceEditor,
        component: editorComponent,
      })
    }
  }

  async loadEditorDependencies() {
    const { assetLoader } = this

    await assetLoader.script(`https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.4/ace.js`)

    await this.loadBraceExtension('language_tools')

    await Promise.all([
      this.loadBraceMode('javascript'),
      this.loadBraceMode('markdown'),
      this.loadBraceMode('css'),
      this.loadBraceMode('jsx'),
      this.loadBraceMode('sh'),
      this.loadBraceMode('html'),
      this.loadBraceTheme('vibrant_ink'),
      this.loadBraceTheme('dracula'),
      this.loadBraceTheme('tomorrow'),
      this.loadBraceTheme('solarized_light'),
      this.loadBraceTheme('solarized_dark'),
    ])

    const ReactAce = require('react-ace')
    return { ReactAce: ReactAce.default || ReactAce }
  }

  async loadBraceExtension(extension) {
    await this.assetLoader.script(`https://unpkg.com/brace@0.11.1/ext/${extension}`)
    return extension
  }

  async loadBraceMode(mode) {
    await this.assetLoader.script(`https://unpkg.com/brace@0.11.1/mode/${mode}`)
    return mode
  }

  async loadBraceTheme(theme) {
    await this.assetLoader.script(`https://unpkg.com/brace@0.11.1/theme/${theme}`)
    return theme
  }

  async enableBabel(options = {}) {
    const babel = this.runtime.feature('babel', options)
    await babel.enable(options)
    await babel.whenReady()

    return (this.babel = babel)
  }

  makeDocumentEditable(documentHelper) {
    const { get } = this.lodash
    const { runtime } = this

    if (documentHelper.blockContent) {
      return documentHelper
    }

    console.log('Preparing Document For Editor Sync', documentHelper)

    const codeBlocksContent = documentHelper.codeBlocks.reduce(
      (memo, codeBlock) => ({
        ...memo,
        [get(codeBlock, 'position.start.line')]: get(codeBlock, 'value'),
      }),
      {}
    )

    runtime.makeObservable(
      {
        components: ['shallowMap', {}],
        mdxProps: ['shallowMap', {}],
        editors: ['shallowMap', {}],
        blockContent: ['shallowMap', codeBlocksContent],
      },
      documentHelper
    )

    return documentHelper
  }
}
