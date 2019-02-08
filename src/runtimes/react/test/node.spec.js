import runtime from '../src'
import React from 'react'
const code = `
import React, { Component } from 'react'
export default class App extends React.Component {
  render() {
    return <div>Hello World</div>
  }
}
`

describe('@skypager/react', function() {
  it('has a server renderer', function() {
    runtime.should.have.property('renderer')
  })

  it('has a browser vm', function() {
    runtime.should.have.property('browserVm')
  })

  it('can transpile react jsx', async function() {
    const parsed = await runtime.renderer.parse(code)
    parsed.should.include('class App')
    parsed.should.include('use strict')
  })

  it('can load react from scripts', async function() {
    const result = await runtime.renderer.createModule(code)
    result.default.should.be.a('function')
  })

  it('can render a component', async function() {
    const { default: App } = await runtime.renderer.createModule(code)
    const html = runtime.renderer.renderToHtml(<App />)
    html.should.include('<div>Hello World</div>')
  })
})
