import React, { Component } from 'react'
import types from 'prop-types'
import { findDOMNode } from 'react-dom'

export default class Editor extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    id: types.string.isRequired,
    mode: types.oneOf(['html', 'jsx', 'markdown', 'css', 'javascript', 'sh']),
    value: types.string.isRequired,
  }

  state = {
    loading: true,
    value: this.props.value,
  }

  static defaultProps = {
    mode: 'jsx',
  }

  async componentDidMount() {
    const { runtime } = this.context

    if (runtime.features.checkKey('editor')) {
      if (runtime.isFeatureEnabled('editor')) {
        runtime.feature('editor').enable()
      }
    }

    const { ReactAce } = await runtime.editor.loadEditorDependencies()

    this.ReactAce = this.AceEditor = ReactAce

    this.setState({ loading: false })

    const containerNode = findDOMNode(this).closest(
      `${this.props.parentTag || 'div'}[data-line-number]`
    )

    if (containerNode && containerNode.dataset) {
      const lineNumber = containerNode.dataset.lineNumber
      console.log('Setting Editor CodeBlockID', `codeBlock${lineNumber}`)
      this.setState({
        codeBlockId: `codeBlock${lineNumber}`,
      })
    }
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
    const { onChange } = this.props

    if (typeof onChange === 'function') {
      onChange(newValue, ...args)
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
    const { header, footer, results } = this.props
    const { loading, value } = this.state

    if (loading) {
      return this.props.renderLoader ? this.props.renderLoader() : <div />
    }

    const { AceEditor } = this

    console.log('Rendering Editor', this.props)

    return (
      <div>
        {typeof header === 'function' && header(this)}
        <CodeEditor
          {...this.props}
          AceEditor={AceEditor}
          onChange={this.handleChange}
          onLoad={this.handleLoad}
          value={value}
        />
        {typeof footer === 'function' && footer(this)}
      </div>
    )
  }
}

function CodeEditor(props) {
  const { AceEditor, id, mode, value, ...rest } = props

  return (
    <AceEditor
      name={id}
      mode={mode}
      theme="tomorrow"
      width="100%"
      height="100px"
      {...value && { value: String(value).trim() }}
      highlightActiveLine={false}
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
