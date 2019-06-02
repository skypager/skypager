import React, { createRef, useReducer, useEffect, useState, Component } from 'react'
import types from 'prop-types'
import Editor from '@skypager/helpers-document/lib/skypager-document-editor'
import { Loader, Header, Icon } from 'semantic-ui-react'
import { MDXProvider } from '@mdx-js/react'
import DocLink from './DocLink'
import * as semanticUIReact from 'semantic-ui-react'

export const defaultSandbox = Object.assign({}, semanticUIReact, {
  Component,
  useEffect,
  useReducer,
  useState,
  createRef,
  React,
  requestAnimationFrame,
})

const mdxComponents = (baseProps = {}, doc) => ({
  wrapper: props => {
    let children = props.children

    if (props.section) {
      const headingId = doc.runtime.stringUtils.kebabCase(String(props.section).toLowerCase())
      const { headingsMap } = doc
      const loc = headingsMap.headings[props.section] || headingsMap.headings[headingId]

      if (loc) {
        const [line] = loc
        const headingNode = doc.ast.children.find(node => node.position.start.line === line)
        const nextHeading =
          headingNode &&
          doc
            .findAllNodesAfter(headingNode)
            .find(({ type, depth }) => type === 'heading' && depth === headingNode.depth)

        if (headingNode && nextHeading) {
          const startLine = headingNode.position.start.line
          const endLine = nextHeading.position.start.line

          children = children.filter(
            ({ props }) =>
              props['data-line-number'] >= startLine && props['data-line-number'] < endLine
          )
        } else if (headingNode && !nextHeading) {
          const startLine = headingNode.position.start.line
          children = children.filter(({ props }) => props['data-line-number'] >= startLine)
        } else {
          children = [<div>could not find section</div>]
        }
      }
    }

    const wrappedChildren = children.map((child, i) => (
      <div
        className={`mdx-el mdx-${child.props.mdxType}`}
        key={`mdx-${i}`}
        style={{ clear: 'both' }}
      >
        {props.displayGutter && (
          <div className="mdx-gutter" style={{ float: 'left', width: '16px' }}>
            {child.props.mdxType === 'pre' && <Icon name="bars" size="tiny" />}
          </div>
        )}
        <div
          className="mdx-content"
          style={{
            float: 'left',
            width: '100%',
            ...(props.displayGutter && { marginLeft: '20px' }),
          }}
        >
          {child}
        </div>
      </div>
    ))

    return (
      <div>
        <h1 style={{ display: 'none' }}>{doc.title}</h1>
        <main children={wrappedChildren} />
      </div>
    )
  },
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

  inlineCode: props => (
    <code style={{ color: 'magenta' }}>
      <em>{props.children}</em>
    </code>
  ),

  code: props => {
    return (
      <Editor
        {...(props.renderable || props.runnable) && { debounceChangePeriod: 400 }}
        {...props.runnable && { run: true, compileToVMRunner }}
        {...props}
        {...baseProps.code || {}}
        sandbox={{ ...defaultSandbox, ...doc.get('currentState.vmSandbox', {}) }}
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

    const doc = this.loadDocument()
    this.setState({ loading: true, doc })

    if (this.props.processImports) {
      await doc.action('asset-loaders/imports-section')(true)
    }

    this.setState({ loading: false })

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
    const { doc, loading } = this.state
    const { get } = runtime.lodash

    const stateMdxProps = get(this.state, 'mdxProps', {})

    if (!doc || loading) {
      return <div />
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
          dynamicMarkers: [
            {
              inFront: true,
              update: (...args) => {
                console.log('dynamic markers')
                return '<div><h1>wow</h1></div>'
              },
            },
          ],
          requireFn: doc.runtime.moduleFactory.createRequireFunction(`${doc.name}.js`),
          onLoad: (aceEditor, component) => {
            console.log('Ace Editor Loading', doc.runtime.editor)
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
          <Component {...this.props} />
        </div>
      </MDXProvider>
    )
  }
}

async function compileToVMRunner(code, component) {
  const { line, doc } = component.props
  const { runtime } = component.context

  const response = await runtime.appClient.processSnippet({
    content: code,
    code,
    filename: `${doc.name}/${line}.js`,
  })

  return response
}
