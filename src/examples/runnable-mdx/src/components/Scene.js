import React, { Component, createRef } from 'react'
import types from 'prop-types'
import * as THREE from 'three'

export default class Scene extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    name: types.string.isRequired,
  }

  constructor(props, context) {
    super(props, context)
    this.sceneEl = createRef()
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { sceneManager } = runtime

    const { scene, camera, eventLoop, resize } = sceneManager.setup(this.props.name)

    this.scene = scene
    this.camera = camera

    resize()
    requestAnimationFrame(eventLoop)

    window.addEventListener('resize', resize, false)

    this.setState({ sceneRendered: true })

    this.disposer = () => {
      window.removeEventListener('resize', resize)
    }
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  render() {
    return (
      <canvas
        ref={this.sceneEl}
        id={this.props.name}
        style={{ display: 'block', height: '100%', width: '100%', ...this.props.style }}
      />
    )
  }
}
