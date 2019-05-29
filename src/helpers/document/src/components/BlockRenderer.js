import React, { createRef, Component } from 'react'
import types from 'prop-types'
import { render } from 'react-dom'

export default class BlockRenderer extends Component {
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
  }

  state = {
    hasErrors: false,
    content: undefined,
    babelEnabled: false,
    compiled: false,
  }

  renderArea = createRef()

  componentDidUpdate() {
    const { babelEnabled, compiled } = this.state

    if (babelEnabled && !compiled) {
      this.handleCompilation()
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

  async handleCompilation() {
    const { runtime } = this.context
    const { doc, includeExamples } = this.props
    const { editor } = runtime

    const { content } = this.state

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

    const code = this.mergeCode(content, headers)
    const compiler = editor.babel.createCodeRunner(code)

    try {
      const compiled = await compiler({
        ...(doc.state.get('sandbox') || {}),
        ...this.props.sandbox,
        $runtime: runtime,
        $doc: doc,
      })
      render(compiled, this.renderArea.current)
    } catch (error) {
      this.setState({ hasErrors: true, error })
    } finally {
      this.setState({ compiled: true })
    }
  }

  get blockContent() {
    const { line, doc } = this.props
    const codeBlock = doc.codeBlocks.find(block => block.position.start.line === line)
    const blockContent = doc.blockContent.get(line)
    return blockContent || codeBlock.value
  }

  mergeCode(code, headers = []) {
    console.log('merging code', {
      code,
      headers,
    })
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
      className = 'block-renderer-wrapper',
      id = `block-renderer-${this.props.line}`,
    } = this.props
    return (
      <div id={id} className={className} style={style}>
        <div ref={this.renderArea} />
      </div>
    )
  }
}
