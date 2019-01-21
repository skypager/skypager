import React, { Component } from 'react'
import types from 'prop-types'
import ComponentExample from './ComponentExample'
import RunnableExample from './RunnableExample'
import Code from 'components/Documentation/Code'
import { Message } from 'semantic-ui-react'

export default class Editable extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    children: types.string.isRequired,
  }

  buildProps(code = this.props.children) {
    let pairs = {}
    const lines = code.split('\n')

    if (typeof lines[0] === 'string' && lines[0].match(/\/\//)) {
      const configLine = lines.shift()

      pairs = configLine
        .split(/\s+/)
        .map(l => l.trim())
        .reduce((memo, pair) => {
          const [key, value] = pair.split('=')

          if (key && value) {
            memo[key] = value
          }

          return memo
        }, {})
    }

    return { children: lines.join('\n'), ...pairs }
  }

  componentDidCatch(error, info) {
    this.setState({ hasErrors: true, error, errorInfo: info })
  }

  render() {
    const { children, className } = this.props
    const config = this.buildProps(children)
    let language

    if (typeof className === 'string' && className.startsWith('language-')) {
      language = className.replace(/language-/, '')
    }

    if (this.hasErrors) {
      return (
        <Message color="red" title="Something went wrong">
          {this.state.error.message}
        </Message>
      )
    }

    if (language !== 'jsx' && language !== 'js' && language !== 'javascript') {
      return <Code {...this.props} editable={false} />
    }

    switch (config.type) {
      case 'example':
        return <Code {...this.props} editable={false} />
      case 'runnable':
        return <RunnableExample config={config} {...this.props} {...config} />
      default:
        return <ComponentExample config={config} {...this.props} {...config} />
    }
  }
}
