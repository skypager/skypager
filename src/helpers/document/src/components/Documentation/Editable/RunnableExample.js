import React, { isValidElement, createElement, Component } from 'react'
import {
  Message,
  Loader,
  Grid,
  GridRow as Row,
  GridColumn as Col,
  Container,
  Divider,
} from 'semantic-ui-react'
import types from 'prop-types'
import Code from 'components/Documentation/Code'
import Editable from 'components/Documentation/Editable'
import { render as dom } from 'react-dom'

export default class RunnableExample extends Component {
  static contextTypes = { runtime: types.object }

  static propTypes = {
    /** delay in ms between getting new code and attempting to compile and render it*/
    debounce: types.number,
    config: types.object,
  }

  static defaultProps = {
    debounce: 600,
    config: { position: 'side' },
    editorProps: {
      showGutter: true,
    },
  }

  state = {
    valid: false,
    hasErrors: false,
    rendered: false,
    config: this.props.config,
    code: this.props.children.toString(),
    compiled: '',
  }

  handleChange = (code = '', ...args) => {
    const lines = code.split('\n')

    if (typeof lines[0] === 'string' && lines[0].match(/\/\//)) {
      const configLine = lines.shift()

      const pairs = configLine
        .split(/\s+/)
        .map(l => l.trim())
        .reduce((memo, pair) => {
          const [key, value] = pair.split('=')

          if (key && value) {
            memo[key] = value
          }

          return memo
        }, {})

      this._isMounted &&
        this.setState(current => ({
          ...current,
          config: {
            ...current.config,
            ...pairs,
          },
        }))
    }

    code = lines
      .filter(line => !line.trim().startsWith('//'))
      .filter(line => line.trim().length)
      .join('\n')

    this._isMounted && this.setState({ code }, () => this.compile(code))
  }

  compile(code) {
    const { runtime } = this.context
    const { babel } = runtime

    try {
      const compiled = babel.compile(code)

      this._isMounted &&
        this.setState({
          valid: true,
          hasErrors: false,
          compiled,
          rendered: false,
        })
    } catch (error) {
      this._isMounted &&
        this.setState({
          valid: false,
          hasErrors: true,
          error,
        })
    }
  }

  componentWillUnmount() {
    this._isMounted = false
    typeof this.disposer === 'function' && this.disposer()
  }

  componentDidMount() {
    this._isMounted = true

    const { runtime } = this.context

    runtime.feature('babel').enable()

    runtime.babel.whenReady(() => {
      this._isMounted && this.setState({ ready: true })
      this.handleChange(this.state.code)
    })

    this.disposer = runtime.observe(({ name, newValue }) => {
      if (name === 'renderVersion') {
        this.setState({ renderVersion: newValue })
      }
    })
  }

  componentDidUpdate(props, state) {
    if (!this.state.ready) {
      return
    }

    if (!this.state.hasErrors && this.state.compiled !== state.compiled) {
      if (!this.state.rendered) {
        this.handleRender()

        if (!this.debounced) {
          this.handleRender = runtime.lodash.debounce(
            this.handleRender.bind(this),
            this.props.debounce
          )

          this.debounced = true
        }
      }
    }
  }

  componentDidCatch(error, info) {
    this._isMounted && this.setState({ hasErrors: true, error })
  }

  getCodeContext() {
    const { runtime } = this.context
    const { omit, pickBy } = runtime.lodash

    if (this.props.getCodeContext) {
      return this.props.getCodeContext(this.props, this.context)
    }

    const base = pickBy(
      omit(global, 'webkitStorageInfo'),
      (v, k) => k.match(/^[A-Z]/) || ['runtime', 'moment'].indexOf(k) >= 0
    )

    base.global = base.window = global

    base.require = runtime.bundle.require.bind(runtime.bundle)

    base.reRender = () => {
      const { renderVersion = 1 } = runtime.currentState
      console.log('Current Render Version', renderVersion)
      console.log('rerendering')
      runtime.setState({ renderVersion: renderVersion + 1 })
      this.setState({ rendered: false, compiled: '' })
      this.handleChange(this.state.code)
    }

    base.Code = Code
    base.Editable = Editable
    base.console = global.console

    return base
  }

  handleRender() {
    const {
      babel,
      lodash: { isFunction },
    } = this.context.runtime
    const { render = '' } = this.state.config

    if (!this.renderRef) {
      console.log('no render ref', this.refs, this.renderRef)
    }

    try {
      const result = babel.createCodeRunner(`${this.state.compiled}`)(this.getCodeContext())

      this._isMounted && this.setState({ rendered: true })
    } catch (error) {
      this._isMounted && this.setState({ hasErrors: true, error })
    }
  }

  renderBelow() {
    const { position, hideEditor } = this.state.config
    const { code, hasErrors, error } = this.state

    const gridProps = {
      style: {
        marginTop: '48px',
        marginBottom: '48px',
        width: '100%',
      },
    }

    return position === 'above' || position === 'top' ? (
      <Grid {...gridProps}>
        <Row columns="one">
          <Col stretched>
            <div ref={ref => (this.renderRef = ref)} />
            {!hideEditor && <Divider />}
          </Col>
        </Row>
        {!hideEditor && (
          <Row columns="one">
            <Col stretched>
              <Code
                children={code}
                editable
                onChange={this.handleChange}
                {...this.props.editorProps || {}}
              />
              {hasErrors && <Message color="red">{error.message}</Message>}
            </Col>
          </Row>
        )}
      </Grid>
    ) : (
      <Grid {...gridProps}>
        {!hideEditor && (
          <Row columns="one">
            <Col>
              <Code
                children={code}
                editable
                onChange={this.handleChange}
                {...this.props.editorProps || {}}
              />
              {hasErrors && <Message color="red">{error.message}</Message>}
            </Col>
          </Row>
        )}
        <Row columns="one">
          <Col>
            <Divider />
            <div ref={ref => (this.renderRef = ref)} />
          </Col>
        </Row>
      </Grid>
    )
  }

  renderSideBySide() {
    const { position } = this.state.config
    const { code, hasErrors, error } = this.state

    const gridProps = {
      style: {
        marginTop: '48px',
        marginBottom: '48px',
        width: '100%',
      },
      stackable: true,
      divided: 'vertical',
      columns: 'two',
    }

    return position === 'left' || position === 'before' ? (
      <Grid {...gridProps}>
        <Row>
          <Col stretched>
            <div ref={ref => (this.renderRef = ref)} />
          </Col>
          <Col>
            <Code
              children={code}
              editable
              onChange={this.handleChange}
              {...this.props.editorProps || {}}
            />
            {hasErrors && <Message color="red">{error.message}</Message>}
          </Col>
        </Row>
      </Grid>
    ) : (
      <Grid {...gridProps}>
        <Row>
          <Col>
            <Code
              children={code}
              editable
              onChange={this.handleChange}
              {...this.props.editorProps || {}}
            />
            {hasErrors && <Message color="red">{error.message}</Message>}
          </Col>
          <Col stretched>
            <div ref={ref => (this.renderRef = ref)} />
          </Col>
        </Row>
      </Grid>
    )
  }

  render() {
    const { ready } = this.state
    const { position = 'side' } = this.state.config

    if (!ready) {
      return <Loader active />
    }

    return (
      <Container fluid style={{ marginTop: '24px', marginBottom: '24px' }}>
        {position === 'below' || position === 'bottom' || position === 'top' || position === 'above'
          ? this.renderBelow()
          : this.renderSideBySide()}
      </Container>
    )
  }
}

class Boundary extends Component {
  state = { hasError: false }

  componentDidCatch(error) {
    this.setState({ hasError: true, error })
  }

  render() {
    if (this.state.hasError) {
      return <Message title="Something went wrong" content={this.state.error.message} />
    }

    return this.props.children
  }
}
