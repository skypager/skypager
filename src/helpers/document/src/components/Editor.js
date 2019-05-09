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
  }

  handleChange = (newValue, ...args) => {
    const { onChange } = this.props

    if (typeof onChange === 'function') {
      onChange(newValue, ...args)
    }
  }

  render() {
    const { header, footer } = this.props
    const { loading, value } = this.state

    if (loading) {
      return this.props.renderLoader ? this.props.renderLoader() : <div />
    }

    const { AceEditor } = this

    return (
      <div>
        {typeof header === 'function' && header(this)}
        <CodeEditor
          {...this.props}
          AceEditor={AceEditor}
          onChange={this.handleChange}
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
      value={value}
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
