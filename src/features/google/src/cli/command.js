import runtime from '@skypager/node'

import * as calendars from './calendars'
import * as calendarEvents from './calendar-events'
import * as docs from './docs'
import * as files from './files'
import * as folders from './folders'
import * as sheets from './sheets'
import * as utils from './utils'

const { clear, randomBanner, print } = runtime.cli

/** @type {Object<String,*>} */
const ARGV = runtime.argv

/** @type {Array<String>} */
const argvCommands = ARGV._

export const commands = runtime.Helper.createContextRegistry('commands', {
  context: runtime.Helper.createMockContext({
    calendars: () => calendars,
    calendarEvents: () => calendarEvents,
    docs: () => docs,
    files: () => files,
    folders: () => folders,
    sheets: () => sheets,
  }),
})

runtime.commands = commands

export async function main(commands = argvCommands, options = ARGV) {
  const subcommand = commands[0]
  const subcommands = commands.slice(1)

  if (!options.json) {
    clear()
    randomBanner('Skypager')
    print('Google Integration CLI')
  }

  switch (subcommand) {
    case 'authorize':
      await utils.authorize(subcommands, {
        ...options,
        verbose: true,
      })
      process.exit(0)
      break

    case 'console':
      await utils.authorize([], options)
      await runtime.repl('interactive').launch({
        runtime,
        calendars,
        files,
        folders,
        calendarEvents,
        docs,
        sheets,
        utils,
      })
      break

    case 'calendar':
      await utils.authorize([], options)
      if (subcommands[1] === 'events') {
        await calendarEvents.main(subcommands.slice(1), options)
      } else {
        await calendars.main(subcommands, options)
      }
      break

    case 'calendar-events':
      await utils.authorize([], options)
      await calendarEvents.main(subcommands, options)
      break

    case 'calendars':
      await utils.authorize([], options)
      await calendars.main(subcommands, options)
      break

    case 'doc':
    case 'docs':
    case 'documents':
      await utils.authorize([], options)
      await docs.main(subcommands, options)
      break

    case 'files':
      await utils.authorize([], options)
      await files.main(subcommands, options)
      break

    case 'folders':
      await utils.authorize([], options)
      await folders.main(subcommands, options)
      break

    case 'sheets':
    case 'spreadsheets':
      await utils.authorize([], options)
      await sheets.main(subcommands, options)
      break

    default:
      utils.help(subcommands, options)
  }
}

main.help = (...args) => utils.help(...args)

export const subcommands = (main.subcommands = {
  calendars,
  calendarEvents,
  docs,
  files,
  folders,
  sheets,
})

export { utils }

export default main
