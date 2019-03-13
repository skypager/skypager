import React from 'react'
import { Box, Text } from 'ink'
import types from 'prop-types'
import runtime from '@skypager/node'

const { figlet } = runtime.cli

const cache = new Map()

const randomize = (text, options = {}) => {
  if (cache.get(text + options.font)) {
    return cache.get(text + options.font)
  }

  const output = figlet
    .textSync(String(text), options)
    .split('\n')
    .map(section => runtime.cli.random.color(section))
    .join('\n')

  cache.set(text + options.font, output)

  return output
}

export default function Banner({ children, font, content = children, container = {} }) {
  return (
    <Box {...container}>
      <Text>{randomize(content, { font })}</Text>
    </Box>
  )
}
