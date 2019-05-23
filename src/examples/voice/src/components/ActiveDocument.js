import React, { forwardRef, createRef, useState, Component } from 'react'
import types from 'prop-types'
import { Editor } from '@skypager/helpers-document'
import { Grid, Form, Divider, Input, Segment, Header, Button } from 'semantic-ui-react'
import { render, findDOMNode } from 'react-dom'
import { MDXProvider } from '@mdx-js/react'
import VocalProgressBar from './VocalProgressBar'

function handleAction({ action, params = {}, props, doc }) {
  return async e => {
    const { block } = params

    if (block === 'saySomething') {
      const saySomethingBlock = doc.codeBlocks.find(
        block => block && block.meta && block.meta.match(/name=saySomething/)
      )

      eval(`${saySomethingBlock.value}; window.saySomething = say`)

      const phrase = doc.state.get(params.phrase)

      if (phrase && phrase.length) {
        window.saySomething(phrase)
      }
    }
  }
}

const mdxComponents = (baseProps = {}, doc) => ({
  h1: props => <Header as="h1" dividing content={props.children} />,
  h2: props => <Header as="h2" content={props.children} />,
  h3: props => <Header as="h3" content={props.children} />,
  h4: props => <Header as="h4" content={props.children} />,
  h5: props => <Header as="h5" content={props.children} />,
  h6: props => <Header as="h6" content={props.children} />,

  pre: props => <div {...props} />,

  a: props => {
    const { children, href = '' } = props

    if (href.startsWith('doc://')) {
      const { query = '', host: action } = doc.runtime.urlUtils.parseUrl(href)
      const params = query && query.length ? doc.runtime.urlUtils.parseQueryString(query) : {}

      if (action === 'prompt') {
        const [val, setVal] = useState('')
        return (
          <Input
            type="text"
            name={params.name}
            value={val}
            onChange={(e, { value }) => {
              doc.state.set(params.name, value)
              setVal(value)
            }}
          />
        )
      } else {
        return <Button onClick={handleAction({ action, params, props, doc })}>{children}</Button>
      }
    }

    return <a {...props} />
  },

  code: props => {
    return (
      <Editor
        {...props}
        {...baseProps.code || {}}
        footer={footerComponent({ doc })}
        getDocument={() => doc}
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

  async componentDidMount() {
    const { babel = true } = this.props
    const { runtime } = this.context

    if (babel && !global.Babel) {
      await runtime.feature('babel').enable()
      await runtime.feature('babel').whenReady()
      console.log('Babel Loaded!')
    }

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
        if (name === 'mdxProps') {
          this.setState(current => {
            return {
              ...current,
              mdxProps: {
                ...current.mdxProps,
                ...newValue,
              },
            }
          })
        }
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

    const components = mdxComponents(
      {
        ...stateMdxProps,
        ...docStateMdxProps,
        code: {
          ...(stateMdxProps.code || {}),
          ...(docStateMdxProps.code || {}),
          height: '400px',
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
      },
      doc
    )

    const { Component } = doc

    return (
      <MDXProvider components={components}>
        <Component />
      </MDXProvider>
    )
  }
}

function footerComponent({ doc = {} }) {
  class SpeechStatus extends Component {
    state = {
      enabled: false,
      voiceOptions: [],
      phrase: undefined,
    }

    componentDidMount() {
      this.disposer = this.props.doc.state.observe(({ name, newValue }) => {
        if (name === 'speechEnabled') {
          if (newValue) {
            this.setState({ enabled: newValue })
          }
        }
      })
    }

    componentWillUnmount() {
      this.disposer()
    }

    handleToggle = () => {
      const newValue = !this.props.doc.state.get('speechEnabled')

      if (newValue === true) {
        const voices = speechSynthesis.getVoices()
        this.props.doc.runtime
          .feature('voice-synthesis')
          .enable({
            speechSynthesis,
            SpeechSynthesisUtterance,
            voices,
          })
          .then(() => {
            this.props.doc.state.set('speechEnabled', true)
            const voiceOptions = Array.from(
              this.props.doc.runtime.feature('voice-synthesis').speechSynthesis.getVoices()
            ).map(v => ({ key: v.name, value: String(v.name).toLowerCase(), text: v.name }))

            this.setState({ voiceOptions })
          })
      }
    }

    render() {
      if (this.state.enabled) {
        return (
          <Form as={Segment}>
            <Form.Input
              label="What do you want to say?"
              type="text"
              value={this.state.phrase || ''}
              onChange={(e, { value: phrase }) => this.setState({ phrase })}
            />
            <Form.Dropdown
              selection
              value={this.state.voice || 'alex'}
              label="In Whose Voice?"
              options={this.state.voiceOptions}
              onChange={(e, { value }) => this.setState({ voice: value })}
            />
            <Form.Button
              content="Say it!"
              onClick={() =>
                this.props.doc.runtime.synth.say(
                  this.state.phrase,
                  String(this.state.voice).toLowerCase()
                )
              }
            />
          </Form>
        )
      } else {
        return <Button toggle content="Enable Speech Feature" onClick={this.handleToggle} />
      }
    }
  }

  return function(editorComponent) {
    const { thisContext = false, name, runnable = false } = editorComponent.props
    const { value } = editorComponent.state

    if (name === 'saySomething') {
      return <Divider />
    }

    if (name === 'enableSpeech') {
      return (
        <Segment>
          <Header as="h3" content="Let me talk to you" />
          <SpeechStatus doc={doc} />
        </Segment>
      )
    }

    if (name === 'vocalProgress') {
      return (
        <Segment>
          <VocalProgressBar
            doc={doc}
            handleLevelChange={({ message, voice }) => doc.runtime.synth.say(message, voice)}
          />
        </Segment>
      )
    }

    if (name === 'huh') {
      const runHandler = async () => {
        return doc.runtime.appClient
          .processSnippet({
            content: String(value),
          })
          .then(({ instructions }) => {
            const runner = doc.runtime.feature('vm-runner', {
              ...instructions,
              filename: `${doc.name}.md`,
              vmContext: doc.runtime.vm.createContext(
                doc.runtime.lodash.omit(window, 'webkitStorageInfo', 'parent', 'Window')
              ),
            })

            doc.editors.set(editorComponent.props['data-line-number'], {
              ...(doc.editors.get(editorComponent.props['data-line-number']) || {}),
              runner,
            })

            return runner.run({ polyfill: false, thisContext })
          })
      }

      const handleRun = () =>
        editorComponent.handleCommand('run', {
          handler: runHandler,
        })

      return (
        String(runnable) !== 'false' && (
          <Segment basic clearing>
            <Button basic floated="right" onClick={handleRun} content="Run" />
          </Segment>
        )
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
