const runtime = require('@skypager/node')

runtime.use(require('..'))

async function main() {
  const code = `
  import runtime from '@skypager/node'
  import React, { createElement, Component } from 'react'

  const myName = 'test-script-parser'
  const enabledFeatures = runtime.get('enabledFeatureIds', [])

  const MyComponent = () => <div>Hello</div>

  class App extends Component {
    render() {
      return <MyComponent />
    }
  }

  async function main() {
    console.log(runtime.cwd)
    const a = 1

    return a
  };main()
  `

  const test = runtime.script('test', {
    content: code,
  })

  await test.parse()
  const runner = await test.createVMRunner()

  runtime.repl('interactive').launch({
    runtime,
    runner,
    test,
  })
}

main()
