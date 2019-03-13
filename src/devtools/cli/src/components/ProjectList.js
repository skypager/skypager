import React, { Component } from 'react'
import { Color, Box } from 'ink'
import types from 'prop-types'
import runtime from '@skypager/node'

export function ProjectTile({ active = false, project = {} }) {
  const { name } = project

  const color = active ? { rgb: [255, 255, 255], bgKeyword: 'magenta' } : {}

  return (
    <Box marginLeft={4}>
      <Color {...color}>
        {name
          .split('/')
          .slice(1)
          .join('')
          .replace(/^\w.*$-/, '')}
      </Color>
    </Box>
  )
}

export default class ProjectList extends Component {
  static propTypes = {
    runtime: types.object,
    filter: types.func,
    position: types.shape({
      column: types.number,
      row: types.number,
    }),
  }

  static defaultProps = {
    runtime,
    filter: defaultProjectFilter,
    position: {
      row: 0,
    },
  }

  state = {
    projectNames: [],
    position: this.props.position,
  }

  async componentDidMount() {
    const { filter } = this.props
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

  componentDidUpdate(prevProps) {
    if (prevProps.position.row !== this.props.position.row) {
      const { projects = [] } = this.state

      let updateRow = this.props.position.row

      if (this.props.position.row < 0) {
        updateRow = projects.length - 1
      } else if (this.props.position.row > projects.length - 1) {
        updateRow = 0
      }

      const position = {
        row: updateRow,
        column: this.props.position.column,
      }

      this.props.updatePosition(position)
      this.setState({ position })
    }
  }

  isProjectSelected(project) {
    const { projects = [] } = this.state
    const {
      position: { row },
    } = this.state

    const projectIndex = projects.map(p => p.name).indexOf(project.name)

    if (projectIndex === row) {
      return true
    } else {
      return false
    }
  }

  render() {
    const { projects = [] } = this.state

    return (
      <Box flexDirection="column" marginTop={2}>
        {projects.map(project => (
          <ProjectTile
            active={this.isProjectSelected(project)}
            key={project.name}
            project={project}
          />
        ))}
      </Box>
    )
  }
}

function defaultProjectFilter(projects = []) {
  return projects.filter(({ name }) => name.startsWith('@skypager'))
}
