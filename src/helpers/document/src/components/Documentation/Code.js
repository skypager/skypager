import React, { Component } from 'react'
import Editor from './Editor'
import types from 'prop-types'
import omit from 'lodash/omit'

export default class Code extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    /** The Code components expects a string value for children since it is used to render mdx */
    children: types.string.isRequired,
    /** If the CodeBlock is not editable it will be set to readOnly and not let you focus */
    editable: types.bool,
  }

  static defaultPropTypes = {
    editable: false,
  }

  state = {
    content: '',
  }

  componentDidMount() {
    const { children } = this.props
    this.setState(this.format(children))
  }

  format(content) {
    return { content: content.toString() }
  }

  render() {
    const { className = '' } = this.props
    const { content } = this.state

    let mode

    if (typeof className === 'string' && className.startsWith('language-')) {
      mode = className.replace(/language-/, '')
    }

    if (mode === 'javascript') {
      mode = 'jsx'
    } else if (mode === 'shell') {
      mode = 'sh'
    } else if (!mode) {
      mode = 'jsx'
    }

    const forward = {}

    Object.assign(forward, omit(this.props, 'children', 'editable'))

    if (!this.props.editable) {
      Object.assign(forward, {
        onLoad: editor => {
          this.editor = editor
          editor.blur()
        },
        readOnly: true,
        focus: false,
        onFocus: () => {
          this.editor && this.editor.blur()
        },
      })
    } else {
      forward.onChange = (...args) => {
        this.setState({ content: args[0] })
        this.props.onChange && this.props.onChange(...args)
      }
    }

    return (
      <Editor
        editorProps={{
          ...(forward.editorProps || {}),
          useSoftTabs: true,
        }}
        theme="dracula"
        {...forward}
        style={{
          ...(this.props.style || {}),
          ...(forward.style || {}),
        }}
        onLoad={aceEditor => {
          window.aceEditor = aceEditor
          aceEditor.renderer.setPadding(8)
        }}
        value={content}
        mode={mode}
      />
    )
  }
}
