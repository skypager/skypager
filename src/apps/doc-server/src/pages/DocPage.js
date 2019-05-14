import React, { forwardRef, createRef, Component } from 'react'
import types from 'prop-types'
import { Editor, Skypage } from '@skypager/helpers-document'
import { Button } from 'semantic-ui-react'
import { findDOMNode } from 'react-dom'

const TrackableEditor = forwardRef((props, ref) => <Editor ref={ref} {...props} />)

const mdxComponents = (baseProps = {}, parent) => ({
  code: props => {
    return (
      <TrackableEditor
        {...props}
        {...baseProps.code || {}}
        value={props.children}
        mode={props.lang}
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
      if(name === 'docsLoaded' && newValue && !oldValue) {
        !this.state.doc && this.loadDocument()
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
    const doc = runtime.mdxDoc(docId)

    const codeBlocks = doc.body.filter(node => node.type === 'code' && node.lang)

    this.setState({ doc })

    codeBlocks.forEach(codeBlock => {
      const { start } = codeBlock.position
      codeBlock.lineNumber = start
      this[`codeBlock${start}`] = createRef()
    })
  }

  render() {
    const { params } = this.props.match
    const { docId } = params
    const { runtime } = this.context
    const { doc } = this.state

    if (!doc) {
      return <div />
    }

    const components = mdxComponents(
      {
        code: {
          theme: 'vibrant_ink',
          showGutter: true,
          handleResult: editorComponent => {
            const { codeBlockId, results = [], errors = [] } = editorComponent.state
            console.log('Got Results', codeBlockId, results, errors)
          },
          header: editorComponent => {
            return (
              <Button
                content="Run"
                onClick={() => {
                  editorComponent.handleCommand('run', {
                    handler: async code => {
                      const containerNode = findDOMNode(editorComponent).closest(
                        'pre[data-line-number]'
                      )
                      const lineNumber = containerNode.dataset.lineNumber

                      const result = await runtime.appClient.processSnippet({
                        content: code,
                        transpile: true,
                        name: `${docId}-block-${lineNumber}.js`,
                      })

                      const runner = runtime.feature('vm-runner', {
                        ...result.instructions,
                      })

                      await runner.run()

                      window.lastRunner = runner

                      return {
                        results: runner.results,
                        errors: runner.errors,
                        hasErrors: !!runner.errors.length,
                        parsed: runner.parsed,
                        identifiers: runner.identifiers,
                        runner,
                        lineNumber,
                        code,
                      }
                    },
                  })
                }}
              />
            )
          },
          onChange: newValue => {
            console.log('Code Changed', newValue)
          },
        },
      },
      this
    )

    return <Skypage doc={doc} components={components} />
  }
}
