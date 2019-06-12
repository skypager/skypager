import React, { useReducer, useEffect, createRef, useState, Component, Fragment } from 'react'
import types from 'prop-types'
import Editor from '@skypager/helpers-document/lib/skypager-document-editor'
import { Loader, Icon, Header, Button, Segment } from 'semantic-ui-react'
import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import DocLink from './DocLink'

const defaultSandbox = {
  React,
  Component,
  useState,
  useEffect,
  useReducer,
  createRef,
  ...global.semanticUIReact,
  console,
}

const mdxComponents = (baseProps = {}, doc) => ({
  wrapper: (props = {}) => {
    const { children, ...rest } = props

    console.log('wrapper', children)

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
      <Fragment>
        <Segment basic clearing>
          <Button
            basic
            floated="right"
            circular
            icon="bullhorn"
            content="Read this page outloud"
            onClick={() => readAloud(doc)}
          />
        </Segment>
        <main {...rest} children={wrappedChildren} />
      </Fragment>
    )
  },
  h1: props => <Header as="h1" dividing content={props.children} />,
  h2: props => <Header as="h2" content={props.children} />,
  h3: props => <Header as="h3" content={props.children} />,
  h4: props => <Header as="h4" content={props.children} />,
  h5: props => <Header as="h5" content={props.children} />,
  h6: props => <Header as="h6" content={props.children} />,

  pre: props => <div {...props} className="code-wrapper" />,

  a: props => {
    const content = String(props.children).toLowerCase()

    if (content === 'next page') {
      return <Button primary content="Next Page" as={Link} to={props.href} />
    } else if (content === 'previous page') {
      return <Button content="Previous Page" as={Link} to={props.href} />
    }

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
          sandbox: defaultSandbox,
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
        <Component {...this.props} />
      </MDXProvider>
    )
  }
}

async function readAloud(doc) {
  const { sortBy } = doc.lodash

  await doc.runtime.feature('voice-synthesis').enable()

  doc.state.set('readingAloud', true)

  const nodes = doc.select('heading, paragraph')

  const stringified = sortBy(nodes, node => node.position.start.line).map(node =>
    doc.stringify(node)
  )

  stringified.forEach(line => doc.runtime.synth.say(line))
}
