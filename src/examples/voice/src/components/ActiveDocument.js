import React, { forwardRef, createRef, Component } from 'react'
import types from 'prop-types'
import { Editor } from '@skypager/helpers-document'
import { Segment, Header, Button } from 'semantic-ui-react'
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

export default class ActiveDocument extends Component {
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
    const { docId } = this.props

    if (docId !== previousProps.docId) {
      this.loadDocument()
    }
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
    this.docDisposer && this.docDisposer()
  }

  loadDocument() {
    if (this.state.doc && this.state.doc.name === this.props.docId) {
      return
    }

    this.docDisposer && this.docDisposer()

    const { onLoad, docId } = this.props
    const { runtime } = this.context
    const doc = runtime.mdxDoc(`${docId}`, {
      cacheHelper: true,
    })

    if (!doc.editors) {
      doc.editors = new Map()
    }

    onLoad && onLoad(doc, this)

    this.setState({ doc }, () => {
      this.docDisposer = this.state.doc.state.observe(({ name, newValue }) => {
        this.setState({ docState: this.state.doc.currentState })
      })
    })
  }

  render() {
    const { runtime } = this.context
    const { docState, doc } = this.state
    const { get } = runtime.lodash

    const stateMdxProps = get(this.state, 'mdxProps', {})
    const docStateMdxProps = get(docState, 'mdxProps', {})

    if (!doc) {
      return <div />
    }

    const components = mdxComponents({
      ...stateMdxProps,
      ...docStateMdxProps,
      code: {
        ...(stateMdxProps.code || {}),
        ...(docStateMdxProps.code || {}),
        footer: footerComponent({ doc }),
        onLoad: (aceEditor, comp) => {
          const componentProps = comp.props

          if (doc.editors) {
            doc.editors.set(componentProps['data-line-number'], {
              editor: aceEditor,
              component: comp,
            })
          }
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

function footerComponent({ doc = {} }) {
  return function(editorComponent) {
    const { name } = editorComponent.props
    const { value } = editorComponent.state

    if (name === 'saySomething') {
      const runHandler = async () => {
        return doc.runtime.appClient
          .processSnippet({
            content: String(value),
          })
          .then(({ instructions }) => {
            const runner = doc.runtime.feature('vm-runner', {
              ...instructions,
              sandbox: {
                speechSynthesis,
                SpeechSynthesisUtterance,
              },
              filename: `${doc.name}.md`,
            })

            doc.editors.set(editorComponent.props['data-line-number'], {
              ...(doc.editors.get(editorComponent.props['data-line-number']) || {}),
              runner,
            })

            return runner.run({ polyfill: false }).then(() => {
              runner.vmContext.say('YO YO YOOOOO')
            })
          })
      }

      const handleRun = () =>
        editorComponent.handleCommand('run', {
          handler: runHandler,
        })

      return (
        <Segment basic clearing>
          <Button basic floated="right" onClick={handleRun} content="Run" />
        </Segment>
      )
    }
  }
}

/*
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
          */
