import React, { Component } from 'react'
import types from 'prop-types'
import { Segment, Button, Container, Label, Form, Message } from 'semantic-ui-react'
import Editor from '@skypager/helpers-document/lib/skypager-document-editor'
import JsonView from 'react-json-view'

function DisplayResponse({ collapsed = 1, response, runtime }) {
  const { isNumber, isString, isBoolean, isUndefined, isFunction } = runtime.lodash

  if (isNumber(response) || isString(response) || isBoolean(response) || isUndefined(response)) {
    return <pre>{String(response)}</pre>
  } else if (isFunction(response)) {
    return <Editor editable={false} mode="javascript" value={response.toString()} />
  } else if (response) {
    return <JsonView src={response} collapsed={collapsed} />
  }
}

export function ReplOutput({ runtime, history = [], responses = [], processing = false }) {
  const merged = history.map((line, i) => {
    const response = responses[i]

    return {
      line,
      response,
      index: i,
    }
  })

  return merged
    .reverse()
    .slice(0, 4)
    .map(({ line, response, index }, pos) => (
      <div key={`repl-output-${index}`} id={`repl-output-${index}`} className="repl-output-wrapper">
        <Editor mode="javascript" value={line} name={`repl-line-${index}`} editable={false} />
        <Segment basic loading={processing && pos === 0}>
          {response && !processing && (
            <DisplayResponse response={response} runtime={runtime} collapsed={pos > 0 ? true : 1} />
          )}
        </Segment>
      </div>
    ))
}

export default class DocRepl extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    doc: types.object,
  }

  state = {
    history: [],
    responses: [],
    current: '',
    processing: false,
    babelEnabled: false,
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { babelOptions = {} } = this.props

    this.setState({ babelEnabled: !!runtime.editor.babel })

    try {
      if (!runtime.editor.babel) {
        await runtime.editor.enableBabel({
          plugins: ['proposal-object-rest-spread'],
          ...babelOptions,
        })
        this.setState({ babelEnabled: true })
      } else {
        this.setState({ babelEnabled: true })
      }
    } catch (error) {
      console.error(error)
    }
  }

  async componentDidUpdate(pp, ps) {
    if (ps.history.length < this.state.history.length) {
      this.setState({ processing: true })

      try {
        const response = await this.processCommand(
          this.state.history[this.state.history.length - 1]
        )
        this.setState(c => ({
          ...c,
          responses: c.responses.concat([response]),
        }))
      } catch (error) {
        this.setState(c => ({
          ...c,
          responses: c.responses.concat([error]),
        }))
      } finally {
        this.setState({ processing: false })
      }
    }
  }

  runCommand = async () => {
    const { current = '' } = this.state

    if (!current || !current.length) {
      return
    }

    this.setState(c => ({
      ...c,
      history: c.history.concat([c.current]),
      current: '',
    }))
  }

  handleKeyDown = e => {
    if (e.keyCode === 13) {
      e.persist()
      this.runCommand()
    }
  }

  async processCommand(code) {
    const { runtime } = this.context
    const { babel } = runtime.editor
    const { doc } = this.props
    const { clone, result, mapValues } = runtime.lodash

    const run = await babel.createCodeRunner(code)

    let response = await Promise.resolve(run({ ...runtime.context, doc })).catch(error => ({
      error: error.message,
    }))

    if (response && response.isHelper && typeof response.constructor === 'function') {
      const state = result(response, 'state.toJSON')
      const featureSettings = result(response, 'featureSettings')
      const featureMethods = result(response, 'featureMethods')
      const hostMethods = result(response, 'hostMethods')
      const observables = Object.getOwnPropertyNames(response)
        .filter(name => response && response[name] && response[name].toJSON)
        .reduce(
          (memo, name) => ({
            ...memo,
            [name]: response[name].toJSON(),
          }),
          {}
        )

      response = mapValues(
        {
          uuid: response.uuid,
          cacheKey: response.uuid,
          options: response.options,
          providerKeys: Object.keys(response.provider),
          optionTypes: response.optionTypes,
          providerTypes: response.providerTypes,
          ...clone(response),
          ...(state && {
            currentState: state,
            stateVersion: response.stateVersion,
            stateHash: runtime.hashObject(state),
          }),
          ...(featureSettings && { featureSettings }),
          ...(featureMethods && { featureMethods }),
          ...(hostMethods && { hostMethods }),
          ...observables,
        },
        v => (v && typeof v.toJSON === 'function' ? v.toJSON() : v)
      )
    } else if (response && response.lodash && response.uuid && response.cwd && response.selectors) {
      const registries = Object.getOwnPropertyNames(runtime)
        .filter(name => {
          const d = Object.getOwnPropertyDescriptor(runtime, name)
          return d && d.value && d.value.available && d.value.lookup
        })
        .reduce(
          (memo, name) => ({
            ...memo,
            [name]: {
              available: runtime.get([name, 'available']),
            },
          }),
          {}
        )

      response = {
        uuid: runtime.uuid,
        cwd: runtime.cwd,
        argv: runtime.argv,
        env: runtime.env,
        stateVersion: runtime.stateVersion,
        currentState: runtime.currentState,
        stateHash: runtime.stateHash,
        featureStatus: runtime.featureStatus.toJSON(),
        enabledFeatureIds: runtime.enabledFeatureIds,
        registries,
      }
    }

    return runtime.lodash.cloneDeep({ response }).response
  }

  renderMultiLineEditor() {
    const { current } = this.state

    return (
      <div>
        <Editor
          name="replEditor"
          id="replEditor"
          mode="javascript"
          maxLines={16}
          minLines={8}
          value={current}
          onChange={(e, { value }) => this.setState({ current: value })}
        />
        <Button floated="right" content="Run" icon="lightning" />
      </div>
    )
  }

  renderSingleLineInput() {
    const { current, processing } = this.state
    return (
      <Form fluid>
        <Form.Input
          disabled={processing}
          placeholder="Enter some code and hit enter."
          type="text"
          fluid
          value={current}
          onKeyDown={this.handleKeyDown}
          onChange={(e, { value }) => this.setState({ current: value })}
        />
      </Form>
    )
  }

  render() {
    const { runtime } = this.context
    const { editorMode, current, history, responses, processing } = this.state

    return (
      <Container>
        {editorMode ? this.renderMultiLineEditor() : this.renderSingleLineInput()}
        <Container style={{ paddingTop: '16px' }}>
          <ReplOutput
            runtime={runtime}
            history={history}
            responses={responses}
            processing={processing}
          />
        </Container>
      </Container>
    )
  }
}
