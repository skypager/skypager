import React, { Component } from 'react'
import types from 'prop-types'
import AceEditor from 'react-ace'

import 'brace/mode/javascript'
// import 'brace/mode/markdown'
import 'brace/mode/css'
import 'brace/mode/jsx'
import 'brace/mode/sh'
// import 'brace/mode/html'
import 'brace/theme/vibrant_ink'
import 'brace/theme/dracula'
import 'brace/theme/tomorrow'
import 'brace/theme/solarized_light'
import 'brace/theme/solarized_dark'

export default class Editor extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    id: types.string.isRequired,
    mode: types.oneOf(['html', 'jsx', 'markdown', 'css', 'javascript', 'sh']),
    value: types.string.isRequired,
    innerProps: types.object,
    wrapperProps: types.object,
    headerProps: types.object,
    footerProps: types.object,
  }

  static defaultProps = {
    mode: 'jsx',
  }

  state = {
    loading: false,
    value: this.props.value,
  }

  handleRunResult = async (result = {}) => {
    const { handleResult } = this.props
    const { results = [], errors = [], hasErrors = !!errors.length, identifiers = [] } = result
    this.setState(
      {
        results,
        errors,
        hasErrors,
        identifiers,
      },
      () => handleResult && handleResult(this)
    )
  }

  handleCommand = async (command, options = {}) => {
    const { value } = this.state

    switch (command) {
      case 'run':
        const { handler } = options
        await handler(value).then(this.handleRunResult)
        break
      default:
        break
    }
  }

  handleChange = (newValue, ...args) => {
    const { getDocument, onChange } = this.props

    if (typeof onChange === 'function') {
      onChange(newValue, ...args)
    }

    if (typeof getDocument === 'function') {
      const lineNumber = this.props['data-line-number']

      if (lineNumber) {
        console.log('updating document codeblock content')
        const doc = getDocument()
        doc.blockContent.set(lineNumber, newValue)
        const codeBlock = doc.codeBlocks.find(
          ({ position }) => position && position.start.line === lineNumber
        )

        if (codeBlock) {
          console.log('updating the code block in the ast')
          codeBlock.value = newValue
        }
      }
    }
  }

  handleLoad = editor => {
    const { onLoad } = this.props

    this.editor = editor

    if (onLoad) {
      onLoad(editor, this, this.props)
    }
  }

  addDynamicMarker = marker => {
    this.editor.session.addDynamicMarker(marker)
  }

  render() {
    console.log('Rendering Editor', this.props)
    const {
      header = () => null,
      footer = () => null,
      renderLoader = () => null,
      wrapperProps,
      headerProps,
      footerProps,
      innerProps,
    } = this.props

    const { loading, value } = this.state

    if (loading) {
      return renderLoader()
    }

    return (
      <div className="sk-editor-wrapper" {...wrapperProps}>
        <div className="sk-editor-header" {...headerProps} children={header(this)} />
        <div className="sk-inner-wrapper" {...innerProps}>
          <CodeEditor
            {...this.props}
            onChange={this.handleChange}
            onLoad={this.handleLoad}
            value={value}
          />
        </div>
        <div className="sk-editor-footer" {...footerProps} children={footer(this)} />
      </div>
    )
  }
}

function CodeEditor(props) {
  const { id, mode, value, ...rest } = props

  return (
    <AceEditor
      name={id}
      mode={mode}
      theme="dracula"
      width="100%"
      height="100px"
      {...value && { value: String(value).trim() }}
      highlightActiveLine={false}
      minLines={1}
      maxLines={Infinity}
      showGutter={false}
      showPrintMargin={false}
      tabSize={2}
      {...rest}
      style={{
        padding: '28px',
        ...(rest.style || {}),
      }}
      editorProps={{ $blockScrolling: Infinity, ...(rest.editorProps || {}) }}
    />
  )
}
