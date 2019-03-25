import React, { Component } from 'react'
import types from 'prop-types'
import Cytoscape from 'components/Cytoscape'
import { Button, Popup, Grid, Form, Segment, Divider, Container, Header } from 'semantic-ui-react'
import * as Layouts from 'components/Cytoscape/layouts'
import SettingsForm from 'components/Cytoscape/components/SettingsForm'

function createNode(moduleGraphNode, options = {}) {
  const { name } = moduleGraphNode
  return {
    data: {
      id: name,
      label: name,
    },
    classes: ['web-application'],
  }
}

function createEdge(relationship, options = {}) {
  const { source, target, type } = relationship
  return {
    data: {
      source,
      target,
    },
    classes: [type],
  }
}

export default class GraphExplorer extends Component {
  static contextTypes = { runtime: types.object }

  state = {
    graphSource: 'modules',
    layoutType: 'Dagre',
    renderVersion: 0,
    rootNode: '@skypager/web',
  }

  constructor(props, context) {
    super(props, context)
    const { debounce } = this.context.runtime.lodash

    this.updateVersion = debounce(this.updateVersion, 300)
  }

  fetchGraph(params = {}) {
    const { graphSource } = this.state

    if (graphSource === 'modules') {
      return fetchModulesGraph.call(this, params)
    }

    if (graphSource === 'packages') {
      return fetchPackageGraph.call(this, params)
    }
  }

  updateVersion() {
    this.setState({ renderVersion: this.state.renderVersion + 1 })
  }

  handleSettingsUpdate = newValues => {
    const { layoutType } = this.state
    const layoutProvider = Layouts[layoutType]
    const layoutSettings = layoutProvider[layoutType]
    const { cytoscape } = this.refs

    if (cytoscape.cyInstance) {
      const layoutUpdates = {
        ...layoutSettings,
        ...newValues,
      }

      cytoscape.cyInstance.layout(layoutUpdates).run()
    }
  }

  handleFieldChange = (e, { name, value }) =>
    this.setState({
      [name]: value,
    })

  handleRootNodeChange = (e, { name, value }) =>
    this.setState({ [name]: value }, () => {
      this.updateVersion()
    })

  handleNodeTap = e => {
    const node = e.target
    const data = node.data()
    const { id } = data

    const { index } = this.state

    if (index && index.has(id)) {
      const selectedPackage = index.get(id)
      this.setState({ selectedPackage })
    }
  }

  renderLayoutSettings() {
    const { layoutType } = this.state
    const layoutProvider = Layouts[layoutType]

    if (!layoutProvider) {
      return <div />
    }

    return [
      <Divider />,
      <SettingsForm onUpdate={this.handleSettingsUpdate} layout={layoutProvider} />,
    ]
  }

  renderSettingsForm() {
    const { index = new Map(), rootNode, graphSource, layoutType } = this.state

    return (
      <Segment basic inverted style={{ minWidth: '640px' }}>
        <Form inverted style={{ paddingRight: '24px', paddingLeft: '24px' }}>
          <Form.Group inline>
            {/* test */}
            <Form.Dropdown
              label="Root Package"
              name="rootNode"
              search
              selection
              options={Array.from(index.keys())
                .sort()
                .map(value => ({ value, text: value }))}
              value={rootNode}
              onChange={this.handleRootNodeChange}
            />
            <Form.Dropdown
              label="Source"
              name="graphSource"
              selection
              options={[
                {
                  value: 'modules',
                  text: 'NPM Modules',
                },
                {
                  value: 'packages',
                  text: 'Portfolio Packages',
                },
              ]}
              value={graphSource}
              onChange={this.handleFieldChange}
            />
          </Form.Group>
          <Form.Dropdown
            label="Layout Type"
            name="layoutType"
            selection
            options={layoutItems}
            value={layoutType}
            onChange={this.handleFieldChange}
          />
        </Form>
        {this.renderLayoutSettings()}
      </Segment>
    )
  }

  renderSelectedPackage() {
    const { selectedPackage } = this.state

    if (!selectedPackage) {
      return
    }

    return (
      <Segment style={{ position: 'absolute', left: '40px', top: '40px', width: '640px' }}>
        <Header content={selectedPackage.name} subheader={`Version ${selectedPackage.version}`} />
      </Segment>
    )
  }

  render() {
    const { rootNode, layoutType, graphSource } = this.state

    return (
      <Container style={{ position: 'relative', height: '100%', width: '100%' }}>
        <Grid style={{ height: '100%', width: '100%' }}>
          <Grid.Column width={16} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 5000 }}>
              <Popup
                trigger={<Button icon="settings" />}
                content={() => this.renderSettingsForm()}
                on="click"
                position="top right"
              />
            </div>
            <Cytoscape
              styles={graphStyles}
              graphSource={graphSource}
              ref="cytoscape"
              fetchGraph={this.fetchGraph.bind(this)}
              layoutType={layoutType}
              rootNode={rootNode}
              renderVersion={this.state.renderVersion}
              onNodeTap={this.handleNodeTap}
            />
          </Grid.Column>
        </Grid>
        {this.renderSelectedPackage()}
      </Container>
    )
  }
}

export const layoutItems = Object.keys(Layouts).map(name => ({
  text: name,
  value: name,
}))

export const graphStyles = [
  {
    selector: 'node[label]',
    style: {
      label: 'data(label)',
      'background-color': 'rgba(230, 230, 230, 0.8)',
    },
  },
  {
    selector: 'edge.devDependencies',
    style: {
      opacity: 0.2,
    },
  },
  {
    selector: 'edge.dependencies',
    style: {
      opacity: 0.2,
    },
  },
  {
    selector: 'edge[label]',
    style: {
      label: 'data(label)',
      width: 3,
    },
  },
]

async function fetchModulesGraph(params = {}) {
  const { runtime } = this.context
  const { flatten } = runtime.lodash

  params = { rootNode: this.state.rootNode || '@skypager/web', ...params }

  const { rootNode } = params

  const response = await runtime.appClient.loadModuleGraph(params)

  let { edges = [], nodes = [] } = response

  const index = new Map()
  const targets = new Map()
  const sources = new Map()

  nodes.forEach((node, i) => {
    index.set(node.name, node)
  })

  edges.forEach(({ type, target, source }, i) => {
    const s = sources.get(source) || []
    const t = targets.get(target) || []

    if (type === 'dependencies') {
      sources.set(source, s.concat([target]))
    }
    targets.set(target, t.concat([source]))
  })

  const dependencies = sources.get(rootNode)
  const shown = new Map()

  nodes = nodes.reduce((memo, node) => {
    if (node.name === rootNode || dependencies.indexOf(node.name) >= 0) {
      shown.set(node.name, true)
      const n = createNode(node)

      if (node.name === rootNode) {
        n.classes.push('root-node')
      }
      memo.push(n)
    }

    const descendants = flatten(dependencies.map(n => sources.get(n)))

    if (descendants.indexOf(node.name) >= 0) {
      shown.set(node.name, true)
      memo.push(createNode(node))
    }

    return memo
  }, [])

  edges = edges.reduce((memo, edge) => {
    if (shown.has(edge.source) && shown.has(edge.target)) {
      memo.push(createEdge(edge))
    }

    return memo
  }, [])

  const transformed = { nodes, edges }

  window.graphState = { index, transformed, nodes, edges }

  this.setState({ loading: false, elements: transformed, index, targets, sources })

  return { elements: transformed }
}

async function fetchPackageGraph(params = {}) {
  const { runtime } = this.context
  const response = await runtime.appClient.loadPackageGraph(params)

  let { edges = [], nodes = [] } = response

  const index = new Map()

  nodes = nodes
    .filter(node => node && node.data && node.data.id !== 'skypager')
    .map(node => {
      node.data.label = `@skypager/${node.data.label}`
      return node
    })

  edges = edges.filter(edge => {
    const { source, target } = edge.data

    if (target === 'skypager' || source === 'skypager') {
      return false
    }

    return true
  })

  nodes.forEach((node, i) => {
    const { data } = node

    if (data && data.id) {
      index.set(data.id, true)
    }
  })

  const transformed = { nodes, edges }

  window.graphState = { index, transformed, nodes, edges }

  this.setState({ loading: false, elements: transformed, index })

  return { elements: transformed }
}
