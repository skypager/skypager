import React, { Component } from 'react'
import types from 'prop-types'

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
    loading: true,
    value: this.props.value,
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

    const { AceEditor } = this

    if (loading) {
      return renderLoader()
    }

    return (
      <div className="sk-editor-wrapper" {...wrapperProps}>
        <div className="sk-editor-header" {...headerProps} children={header(this)} />
        <div className="sk-inner-wrapper" {...innerProps}>
          <CodeEditor
            {...this.props}
            AceEditor={AceEditor}
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
