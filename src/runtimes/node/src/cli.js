import pretty from 'pretty-cli'
import figlet from 'figlet'
import emoji from 'node-emoji'
import Table from 'cli-table'
import sample from 'lodash/sample'
import colors from 'colors'
import chunk from 'lodash/chunk'
import prompt from 'prompt'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import Spinner from 'cli-spinner'

export const defaultTemplate = {
  info: message => message,
  warning: message => message,
  error: message => `${emoji.get('boom')}  ${message}`,
  success: message => message,
  note: message => message,
}

export const cli = pretty({
  template: defaultTemplate,
})

cli.cmd = (...args) => cli.addCustomMethod(...args)

export default cli

cli.addCustomMethod(
  'print',
  (messages = [], indentationLevel = 0, beforePadding = 0, afterPadding = 0) => {
    if (isString(messages)) {
      messages = messages.split('\n')
    } else if (isArray(messages)) {
      //
    } else if (isObject(messages)) {
      messages = require('util')
        .inspect(messages)
        .split('\n')
    }

    if (beforePadding > 0) {
      console.log(Array(beforePadding).join('\n'))
    }

    messages
      .filter(message => typeof message === 'string' && message.length > 0)
      .forEach(message => {
        console.log(
          indentationLevel > 0 ? `${Array(indentationLevel).join(' ')}${message}` : message
        )
      })

    if (afterPadding > 0) {
      console.log(Array(afterPadding).join('\n'))
    }
  }
)

const tables = {}

Object.defineProperty(cli, 'helpers', {
  enumerable: false,
  value: {
    colors,
    figlet,
    Table,
    emoji,
    colors,
    prompt,
    Spinner,
  },
})

Object.defineProperty(cli, 'tables', {
  enumerable: false,
  get: () => tables,
})

Object.defineProperty(cli, 'availableFonts', {
  enumerable: false,
  get: () => require('figlet').fontsSync(),
})

Object.defineProperty(cli, 'figlet', {
  enumerable: false,
  value: figlet,
})

Object.defineProperty(cli, 'prompt', {
  enumerable: false,
  value: prompt,
})

Object.defineProperty(cli, 'ask', {
  enumerable: false,
  value: (schema = {}) => {
    if (!prompt.started) {
      prompt.message = process.env.SKYPAGER_CLI_PROMPT_MESSAGE || ''
      prompt.delimeter = process.env.SKYPAGER_CLI_PROMPT_DELIMETER || ''
      prompt.start()
    }

    return new Promise((resolve, reject) => {
      prompt.get({ properties: schema }, (err, results) => (err ? reject(err) : resolve(results)))
    })
  },
})

Object.defineProperty(cli, 'emoji', {
  enumerable: false,
  value: emoji,
})

Object.defineProperty(cli, 'icon', {
  enumerable: false,
  value: (...args) => emoji.get(...args),
})

Object.defineProperty(cli, 'spinner', {
  enumerable: false,
  value: Spinner,
})

Object.defineProperty(cli, 'colors', {
  enumerable: false,
  value: colors,
})

Object.defineProperty(cli, 'random', {
  enumerable: false,
  value: {
    get color() {
      return sample([
        colors.red,
        colors.cyan,
        colors.magenta,
        colors.green,
        colors.blue,
        colors.white,
        colors.grey,
        colors.yellow,
      ])
    },
    get font() {
      return sample(require('figlet').fontsSync())
    },
  },
})

cli.addCustomMethod('stripedBanner', (value = 'Skypager', options = {}) => {
  const { colors = {}, font = cli.random.font } = options

  const color = (text, chunkId) => {
    const c = (colors[chunkId] = colors[chunkId] || cli.random.color)
    return c(text)
  }

  return cli.figlet
    .textSync(value, { font })
    .split('\n')
    .map(line =>
      chunk(line.split(''), value.length)
        .map((section, i) => color(section.join(''), i))
        .join('')
    )
    .join('\n')
})

cli.addCustomMethod('randomBanner', (value, options = {}) => {
  const { font = cli.random.font, indent = 2, debug = false } = options

  if (debug) {
    console.log('Using font', font)
  }

  const banner = figlet
    .textSync(value, {
      font,
      ...(options.text || {}),
    })
    .split('\n')
    .map(line => cli.random.color(line))
    .join('\n')

  cli.print(banner, indent, 1, 1)
})

cli.addCustomMethod('banner', (value, indent = 2, beforePadding = 1, afterPadding = 1) => {
  cli.print(
    figlet.textSync(value || 'Skypager', {
      font: 'Slant',
    }),
    indent,
    beforePadding,
    afterPadding
  )
})

cli.addCustomMethod(
  'displayTable',
  (tableName, data, indent = 2, beforePadding = 1, afterPadding = 1) => {
    const table = tables[tableName]
    table.push(...data)
    cli.print(table.toString(), indent, beforePadding, afterPadding)
  }
)

cli.addCustomMethod(
  'defineTable',
  (tableName, params = {}) => (tables[tableName] = new Table(params))
)

cli.addCustomMethod('clear', () => {
  !process.env.NO_CLEAR && !process.argv.indexOf('--no-clear') >= 0 && process.stdout.write('\x1bc')
})
