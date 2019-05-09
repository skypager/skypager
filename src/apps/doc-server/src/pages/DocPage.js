import React, { Component } from 'react'
import types from 'prop-types'
import { Editor, Skypage } from '@skypager/helpers-document'
import { Button } from 'semantic-ui-react'
import { findDOMNode } from 'react-dom'

const mdxComponents = (baseProps = {}) => ({
  code: props => (
    <Editor {...props} {...baseProps.code || {}} value={props.children} mode={props.lang} />
  ),
})

export default class DocPage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  render() {
    const { params } = this.props.match
    const { docId } = params

    const doc = this.context.runtime.mdxDoc(docId)

    const components = mdxComponents({
      code: {
        theme: 'vibrant_ink',
        showGutter: true,
        header: editorComponent => {
          return (
            <Button
              content="Run"
              onClick={() =>
                console.log(
                  editorComponent.props,
                  editorComponent.state,
                  findDOMNode(editorComponent).closest('pre[data-line-number]')
                )
              }
            />
          )
        },
        onChange: newValue => {
          console.log('Code Changed', newValue)
        },
      },
    })

    return <Skypage doc={doc} components={components} />
  }
}
