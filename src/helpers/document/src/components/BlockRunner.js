import React, { createElement, createRef, Component } from 'react'
import types from 'prop-types'
import { render } from 'react-dom'

export default class BlockRunner extends Component {
  static contextTypes = {
    runtime: types.shape({
      editor: types.shape({
        enableBabel: types.func,
      }),
    }),
  }

  static propTypes = {
    doc: types.object.isRequired,
    line: types.number.isRequired,
    sandbox: types.object,
    run: types.bool,
    autorun: types.bool,
  }

  state = {
    hasErrors: false,
    content: undefined,
    babelEnabled: false,
    compiled: false,
    ready: false,
    running: false,
    ran: false,
    logs: [],
  }

  renderArea = createRef()

  async componentDidUpdate(prevProps, prevState) {
    const { autorun, run = autorun } = this.props
    const { babelEnabled, compiled, ready, ran, running } = this.state

    if (babelEnabled && !compiled) {
      await this.handleCompilation()
    } else if (
      run &&
      babelEnabled &&
      (compiled && !prevState.compiled) &&
      ready &&
      !ran &&
      !running
    ) {
      // the code was just compiled
      await this.handleRun()
    }
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { doc, line, babelOptions = {} } = this.props

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

    this.setState({ content: this.blockContent })

    this.disposer = doc.blockContent.observe(({ name, newValue }) => {
      if (String(name) === String(line)) {
        this.setState({ content: newValue, compiled: false })
      }
    })
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  async handleRun() {
    this.setState({ running: true, ran: false, logs: [] })

    const { runtime } = this.context
    const { console: captureConsole, doc } = this.props
    const { runner } = this.state

    const response = await runner
      .run({
        ...this.props.sandbox,
        $runtime: runtime,
        $doc: doc,
        $el: this.renderArea.current,
        render,
        ...(captureConsole && { console: createMockConsole(this) }),
      })
      .catch(error => {
        console.log('handle run error', error)
        return error
      })

    console.log('Received Run Response', response)

    return response
  }

  async handleCompilation() {
    const { detailed } = this.props
    const { content } = this.state

    const runner = await (detailed
      ? this.compileToVMRunner(content)
      : this.compileToScriptRunner(content))

    this.setState({ compiled: true, ready: true, ran: false, running: false, runner })
  }

  async compileToVMRunner(code) {
    code = code || this.buildBlockContent()
    const instructions = await this.props.createVMInstructions(code, this)

    const { vmContext, doc, line } = this.props
    const { runtime } = this.context

    const vmRunner = runtime.feature('vm-runner', {
      ...instructions,
      content: code,
      ...(vmContext && { vmContext }),
      filename: `${doc.name}/${line}.js`,
    })

    return vmRunner
  }

  async compileToScriptRunner(code) {
    code = code || this.buildBlockContent()

    const { runtime } = this.context
    const { babel } = runtime.editor

    const run = await babel.createCodeRunner(code)

    return {
      run: async (...args) => run(...args),
    }
  }

  buildBlockContent(content = this.state.content || '') {
    const { doc, includeExamples } = this.props

    if (!content) {
      return
    }

    let headers = []

    if (includeExamples && includeExamples.length) {
      const includeCodeBlocks = doc
        .select(`code[meta*="example=${includeExamples}"]`)
        .map(({ value }) => value)
      headers.push(...includeCodeBlocks)
    }

    return this.mergeCode(content, headers)
  }

  get blockContent() {
    const { line, doc } = this.props
    const codeBlock = doc.codeBlocks.find(block => block.position.start.line === line)
    const blockContent = doc.blockContent.get(line)
    return blockContent || codeBlock.value
  }

  mergeCode(code, headers = []) {
    const { runtime } = this.context
    const { uniq, partition } = runtime.lodash

    let [imports = [], body = []] = partition(code.split('\n'), line =>
      line.trim().startsWith('import')
    )

    headers.forEach(block => {
      const [hImports, hBody] = partition(block.split('\n'), line =>
        line.trim().startsWith('import')
      )

      imports = [...hImports, ...imports]

      body = [...hBody, ...body]
    })

    return [...uniq(imports), ...body].join('\n')
  }

  render() {
    const {
      style = {},
      className = 'block-runner-wrapper',
      id = `block-runner-${this.props.line}`,
      tag = 'div',
    } = this.props

    const renderArea = createElement(tag, {
      ref: this.renderArea,
    })

    return (
      <div className={className} style={style} id={id}>
        {renderArea}
      </div>
    )
  }
}

function createMockConsole(component) {
  const fn = level => (...args) =>
    component.setState(current => ({
      ...current,
      logs: current.logs.concat([
        {
          level,
          args,
        },
      ]),
    }))

  return {
    log: fn('info'),
    info: fn('info'),
    warn: fn('warn'),
    debug: fn('debug'),
    error: fn('error'),
    trace: fn('info'),
  }
}
