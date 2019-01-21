import React, { Component } from 'react'
import types from 'prop-types'
import { Loader } from 'semantic-ui-react'
import extensions from './extension-loader'
import * as Layouts from './layouts'

console.log(extensions)

export default class Cytoscape extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    layoutType: types.oneOf(Object.keys(Layouts)),
    fetchGraph: types.func,
    styles: types.arrayOf(types.object),
  }

  static defaultProps = {
    layoutType: 'Dagre',
  }

  cytoscape = global.cytoscape

  constructor(props, context) {
    super(props, context)
    const { runtime } = this.context
    const { debounce } = runtime.lodash

    this.renderGraph = debounce(this.renderGraph.bind(this), 200)

    const layoutProvider = Layouts[this.props.layoutType]
    const layout = layoutProvider[this.props.layoutProvider]

    this.state = {
      loading: true,
      layout,
      dependenciesLoaded: false,
    }
  }

  async componentDidMount() {
    await this.loadCytoscapeDependencies()
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.renderVersion !== this.props.renderVersion) {
      await this.loadCytoscapeDependencies()
      await this.renderGraph()
    }

    if (
      prevProps.layoutType !== this.props.layoutType ||
      prevProps.graphSource !== this.props.graphSource
    ) {
      await this.loadCytoscapeDependencies()

      if (this.state.dependenciesLoaded) {
        await this.renderGraph()
      }
    } else if (!prevState.dependenciesLoaded && this.state.dependenciesLoaded) {
      await this.renderGraph()
    }
  }

  async loadCytoscapeDependencies() {
    if (!this.cytoscape) {
      const bundle = await extensions.unpkg({
        cytoscape: 'cytoscape@3.3.2/dist/cytoscape.umd.js',
      })

      const { cytoscape } = bundle

      this.cytoscape = cytoscape
    }

    const layoutProvider = Layouts[this.props.layoutType]
    const { attach, dependencies } = layoutProvider
    const layout = layoutProvider[this.props.layoutType]

    let bundle

    if (dependencies) {
      this.setState({ dependenciesLoaded: false })
      bundle = await extensions.unpkg(dependencies)
    }

    if (typeof attach === 'function') {
      attach({
        cytoscape: this.cytoscape,
        ...bundle,
      })
    }

    this.setState({ dependenciesLoaded: true, layout })
  }

  async renderGraph(options = {}) {
    const { styles, fetchGraph } = this.props
    const response = await fetchGraph(this.state.filters)

    const { elements } = response

    if (this.cyInstance) {
      this.cyInstance.destroy()
      delete this.cyInstance
    }

    this.cyInstance = this.renderCytoscape({
      layout: this.state.layout,
      ...options,
      styles,
      elements,
    })

    if (this.props.onNodeTap) {
      this.cyInstance.on('tap', 'node', this.props.onNodeTap)
    }
  }

  renderCytoscape(options = {}) {
    options = {
      ...this.props,
      ...options,
    }

    const {
      cytoscape = this.cytoscape,
      styles = this.state.styles || [],
      elements = this.state.elements || [],
      layout = this.state.layout,
    } = options

    return (window.cyInstance = cytoscape({
      container: this.refs.cyContainer,
      // boxSelectionEnabled: false,
      // autounselectify: true,
      ...options,
      layout,
      style: styles,
      elements,
    }))
  }

  render() {
    return (
      <div
        className="cytoscape-container"
        id={this.props.id || 'cy'}
        ref="cyContainer"
        style={{ width: '100%', height: '100%' }}
      />
    )
  }
}
