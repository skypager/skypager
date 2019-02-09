import React, { Fragment, Component } from 'react'
import { render, Box, Static, Text, Color } from 'ink'
import types from 'prop-types'
import runtime from '@skypager/node'

const { icon, figlet } = runtime.cli

const randomize = text =>
  figlet
    .textSync(text, {
      font: runtime.cli.random.font,
    })
    .split('\n')
    .map(line => runtime.cli.random.color(line))
    .join('\n')

function Banner({ children, content = children }) {
  return (
    <Box>
      <Text>{randomize(content)}</Text>
    </Box>
  )
}

class Layout extends Component {
  render() {
    return (
      <Box flexDirection="column">
        <Banner>Skypager</Banner>
        <Box>
          <ProjectList runtime={this.props.runtime} />
        </Box>
      </Box>
    )
  }
}

function ProjectTile({ project = {} }) {
  const { name } = project
  return (
    <Box>
      {name
        .split('/')
        .slice(1)
        .join('')
        .replace(/^\w.*$-/, '')}
    </Box>
  )
}

class ProjectList extends Component {
  state = {
    projectNames: [],
  }

  async componentDidMount() {
    const { packageManager } = this.props.runtime

    packageManager.manifests.observe(() => {
      this.setState({
        projects: filter(packageManager.packageData),
      })
    })

    await packageManager.startAsync()
    this.setState({
      projects: filter(packageManager.packageData),
    })
  }

  render() {
    const { projects = [] } = this.state

    return (
      <Box flexDirection="column">
        <Box>{projects.length} Total Projects</Box>
        {projects.map(project => (
          <ProjectTile key={project.name} project={project} />
        ))}
      </Box>
    )
  }
}

function App({ runtime }) {
  return <Layout runtime={runtime} />
}

function filter(projects) {
  return projects.filter(({ name }) => name.startsWith('@skypager'))
}

module.exports = runtime => render(<App runtime={runtime} />)

setInterval(() => {}, 10)
