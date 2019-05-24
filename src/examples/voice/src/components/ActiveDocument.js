import React, { forwardRef, createRef, useState, Component } from 'react'
import types from 'prop-types'
import Editor from '@skypager/helpers-document/lib/skypager-document-editor'
import { Loader, Input, Header, Button } from 'semantic-ui-react'
import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import DocLink from './DocLink'

const mdxComponents = (baseProps = {}, doc) => ({
  h1: props => <Header as="h1" dividing content={props.children} />,
  h2: props => <Header as="h2" content={props.children} />,
  h3: props => <Header as="h3" content={props.children} />,
  h4: props => <Header as="h4" content={props.children} />,
  h5: props => <Header as="h5" content={props.children} />,
  h6: props => <Header as="h6" content={props.children} />,

  pre: props => <div {...props} />,

  a: props => {
    return <DocLink {...props} parentDocument={doc} />
  },

  code: props => {
    return (
      <Editor
        {...props}
        {...baseProps.code || {}}
        renderLoader={() => <Loader active />}
        getDocument={() => doc}
        value={props.children}
        mode={props.lang ? props.lang : String(props.className).replace(/^language-/, '')}
      />
    )
  },
})

export default class ActiveDocument extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  state = {
    doc: null,
  }

  async componentDidMount() {
    const { runtime } = this.context

    this.setState({ doc: this.loadDocument() })

    this.disposer = runtime.state.observe(({ name, oldValue, newValue }) => {
      if (name === 'mdxProps' && newValue) {
        this.setState({ mdxProps: newValue })
      }
    })
  }

  componentDidUpdate(previousProps) {
    const { docId } = this.props

    if (docId !== previousProps.docId) {
      this.loadDocument()
    }
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  loadDocument() {
    if (this.state.doc && this.state.doc.name === this.props.docId) {
      return
    }

    const { onLoad, docId } = this.props
    const { runtime } = this.context

    const doc = runtime.mdxDoc(`${docId}`, {
      cacheHelper: true,
    })

    runtime.editor.makeDocumentEditable(doc)

    onLoad && onLoad(doc, this)

    return doc
  }

  render() {
    const { runtime } = this.context
    const { doc } = this.state
    const { get } = runtime.lodash

    const stateMdxProps = get(this.state, 'mdxProps', {})

    if (!doc) {
      return <div>No Doc</div>
    }

    const components = mdxComponents(
      {
        ...stateMdxProps,
        code: {
          ...(stateMdxProps.code || {}),
          maxLines: 40,
          wrapperProps: {
            style: {
              marginTop: '40px',
              marginBottom: '40px',
            },
          },
          onLoad: (aceEditor, component) => {
            doc.runtime.editor.syncWithDocument(component, aceEditor, doc)
          },
        },
      },
      doc
    )

    const { Component } = doc

    return (
      <MDXProvider components={components}>
        <div
          className="active-document-wrapper"
          style={{ height: '100%', width: '100%', margin: 0, padding: 0 }}
        >
          <Component />
        </div>
      </MDXProvider>
    )
  }
}
