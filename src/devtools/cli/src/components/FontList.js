import React, { Component } from 'react'
import { Color, Box } from 'ink'
import types from 'prop-types'
import runtime from '@skypager/node'

export function FontTile({ active = false, font }) {
  const color = active ? { rgb: [255, 255, 255], bgKeyword: 'magenta' } : {}

  return (
    <Box marginLeft={4}>
      <Color {...color}>{font}</Color>
    </Box>
  )
}

export default class FontList extends Component {
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
    position: {
      row: 0,
    },
  }

  state = {
    fonts: [],
    allFonts: [],
    currentIndex: 0,
    position: this.props.position,
  }

  async componentDidMount() {
    const allFonts = runtime.cli.figlet.fontsSync()
    this.setState({ allFonts, fonts: allFonts.slice(0, 10) })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.position.row !== this.props.position.row) {
      let { allFonts, currentIndex, fonts = [] } = this.state

      let updateRow = this.props.position.row

      if (currentIndex === 0 && this.props.position.row < 0) {
        updateRow = 0
      } else if (currentIndex >= 1 && this.props.position.row < 0) {
        updateRow = 0
        currentIndex = currentIndex - 1
        fonts = allFonts.slice(currentIndex * 10).slice(0, 10)
      } else if (this.props.position.row > fonts.length - 1) {
        currentIndex = currentIndex + 1
        updateRow = 0
        fonts = allFonts.slice(currentIndex * 10).slice(0, 10)
      }

      const position = {
        row: updateRow,
        column: this.props.position.column,
      }

      this.props.onSelection(fonts[updateRow])
      this.props.updatePosition(position)
      this.setState({ fonts, position, currentIndex })
    }
  }

  isFontSelected(font) {
    const { fonts = [] } = this.state
    const {
      position: { row },
    } = this.state

    const fontIndex = fonts.indexOf(font)

    if (fontIndex === row) {
      return true
    } else {
      return false
    }
  }

  render() {
    const { fonts = [] } = this.state

    return (
      <Box flexDirection="column" marginTop={2}>
        {fonts.slice(0, 10).map(font => (
          <FontTile active={this.isFontSelected(font)} key={font} font={font} />
        ))}
      </Box>
    )
  }
}
