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

    const { runtime } = this.context
    const doc = this.context.runtime.mdxDoc(docId)
    const page = this

    const components = mdxComponents({
      code: {
        theme: 'vibrant_ink',
        showGutter: true,
        header: editorComponent => {
          return (
            <Button
              content="Run"
              onClick={() => {
                editorComponent.handleCommand("run", {
                  handler: async (code) => {
                    const containerNode = findDOMNode(editorComponent).closest('pre[data-line-number]')
                    const lineNumber = containerNode.dataset.lineNumber
                    
                    const result = await runtime.appClient.processSnippet({
                      content: code,
                      transpile: true,
                      name: `${docId}-block-${lineNumber}.js` 
                    })

                    const runner = runtime.feature('vm-runner', {
                      ...result.instructions,
                      requireFunction: (request) => {
                        console.log('Requiring', request)
                        switch(request) {
                          case '@skypager/runtime':
                          case '@skypager/web':
                          case 'skypager':
                            return {
                              __esModule: true,
                              get default() {
                                return runtime
                              }
                            }
                          case '@babel/polyfill':
                            return {}
                          default: 
                            throw new Error(`Could not resolve ${request} in sandbox require function`)
                        }
                      } 
                    })

                    await runner.run()
                    
                    window.lastRunner = runner

                    return {
                      results: runner.results,
                      errors: runner.errors,
                      hasErrors: !!runner.errors.length,
                      runner,
                      lineNumber,
                      code
                    }
                  }
                })
              }}
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
