import React, { Component } from 'react'
import { Box, StdinContext } from 'ink'
import StyledBox from 'ink-box'
import types from 'prop-types'
import runtime from '@skypager/node'
import FontList from '../components/FontList'
import Banner from '../components/Banner'
import KeyHandler from '../components/KeyHandler'

export default class FontPreview extends Component {
  static propTypes = {
    runtime: types.object,
  }

  static defaultProps = {
    runtime,
  }

  state = {
    position: { column: 0, row: 0 },
  }

  updatePosition({ column, row }, ...args) {
    this.setState({ position: { column, row } }, ...args)
  }

  handleKey(char) {
    this.handleNavigationKey(char)
  }

  handleNavigationKey(char) {
    let action

    switch (char) {
      case 'h':
        action = 'left'
        break
      case 'j':
        action = 'down'
        break
      case 'k':
        action = 'up'
        break
      case 'l':
        action = 'right'
        break
      default:
        break
    }

    if (!action) {
      return
    }

    this.setState(current => {
      let key, value

      switch (action) {
        case 'up':
          key = 'row'
          value = current.position.row + 1
          break
        case 'down':
          key = 'row'
          value = current.position.row - 1
          break
        case 'left':
          key = 'column'
          value = current.position.row - 1
          break
        case 'right':
          key = 'column'
          value = current.position.row + 1
          break
        default:
          throw new Error('Invalid Action')
      }

      return {
        ...current,
        position: {
          ...current.position,
          [key]: value,
        },
      }
    })
  }

  updateSelectedFont(selectedFont) {
    this.setState({ selectedFont })
  }

  render() {
    const { runtime } = this.props
    const { position, selectedFont = '1Row' } = this.state

    return (
      <StdinContext.Consumer>
        {({ stdin, setRawMode }) => {
          return (
            <KeyHandler stdin={stdin} setRawMode={setRawMode} handleKey={this.handleKey.bind(this)}>
              <Box>
                <Box marginRight={6}>
                  <FontList
                    updatePosition={this.updatePosition.bind(this)}
                    onSelection={this.updateSelectedFont.bind(this)}
                    position={position}
                    runtime={runtime}
                  />
                </Box>
                <Box paddingTop={4} paddingLeft={4}>
                  <Banner font={selectedFont} content="DAIS" />
                </Box>
              </Box>
            </KeyHandler>
          )
        }}
      </StdinContext.Consumer>
    )
  }
}
