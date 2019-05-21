import React, { forwardRef, createRef, Component } from 'react'
import types from 'prop-types'
import { Editor } from '@skypager/helpers-document'
import { Header, Button } from 'semantic-ui-react'
import { render, findDOMNode } from 'react-dom'
import { MDXProvider } from '@mdx-js/react'

const mdxComponents = (baseProps = {}) => ({
  h1: props => <Header as="h1" dividing content={props.children} />,
  h2: props => <Header as="h2" content={props.children} />,
  h3: props => <Header as="h3" content={props.children} />,
  h4: props => <Header as="h4" content={props.children} />,
  h5: props => <Header as="h5" content={props.children} />,
  h6: props => <Header as="h6" content={props.children} />,

  pre: props => <div {...props} />,
  code: props => {
    return (
      <Editor
        {...props}
        {...baseProps.code || {}}
        showGutter
        showPrintMargin
        value={props.children}
        mode={props.lang ? props.lang : String(props.className).replace(/^language-/, '')}
      />
    )
  },
})

export default class DocPage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  state = {
    doc: null,
  }

  componentDidMount() {
    const { runtime } = this.context

    if (runtime.currentState.docsLoaded) {
      this.loadDocument()
    }

    this.disposer = runtime.state.observe(({ name, oldValue, newValue }) => {
      if (name === 'docsLoaded' && newValue && !oldValue) {
        !this.state.doc && this.loadDocument()
      }

      if (name === 'mdxProps' && newValue) {
        this.setState({ mdxProps: newValue })
      }
    })
  }

  componentDidUpdate(previousProps) {
    const { params } = this.props.match
    const { docId } = params

    if (docId !== previousProps.match.params.docId) {
      this.loadDocument()
    }
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  loadDocument() {
    const { params } = this.props.match
    const { docId } = params
    const { runtime } = this.context
    const doc = runtime.mdxDoc(`${docId}`)

    console.log('loading document', docId, doc)

    const codeBlocks = doc.body.filter(node => node.type === 'code' && node.lang)

    this.setState({ doc })

    codeBlocks.forEach(codeBlock => {
      const { start } = codeBlock.position
      codeBlock.lineNumber = start
      this[`codeBlock${start}`] = createRef()
    })
  }

  render() {
    const { doc } = this.state

    if (!doc) {
      return <div />
    }

    const components = mdxComponents({
      ...(this.state.mdxProps || {}),
      code: {
        ...(this.state.mdxProps && this.state.mdxProps.code && {}),
        onLoad: (editor, comp) => {
          const Range = ace.require('ace/range').Range

          setTimeout(() => {
            comp.addDynamicMarker(
              {
                id: 'i1',
                inFront: true,
                update: (html, markerLayer, session, config) => {
                  const range = new Range(1, 4, 0, 0)
                  range.start = session.doc.createAnchor(range.start)
                  range.end = session.doc.createAnchor(range.end)
                  const markerHTML = getMarkerHTML(markerLayer, config, range, 'error-marker')
                  console.log({ markerHTML, screenRange: range.toScreenRange(session) })
                  const markerElement = document.createElement('div')
                  render(<div style={{ position: 'absolute' }}>WOW</div>, markerElement)
                  markerLayer.element.appendChild(markerElement)
                },
              },
              true
            )
          }, 500)
        },
      },
    })

    const { Component } = doc

    return (
      <MDXProvider components={components}>
        <Component />
      </MDXProvider>
    )
  }
}

function getMarkerHTML(markerLayer, config, range, markerClass) {
  let stringBuilder = []

  console.log('range', range.isMultiLine())
  window.lastRange = range
  window.markerLayer = markerLayer
  if (range.isMultiLine()) {
    // drawTextMarker is defined by ace's marker layer
    markerLayer.drawTextMarker(stringBuilder, range, markerClass, config)
  } else {
    // drawSingleLineMarker is defined by ace's marker layer
    markerLayer.drawSingleLineMarker(
      stringBuilder,
      range,
      `${markerClass} ace_start ace_br15`,
      config
    )
  }

  console.log('string buuilder', stringBuilder)

  return stringBuilder
}
