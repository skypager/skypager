import runtime from '@skypager/node'

import calendars from './calendars'
import calendarEvents from './calendar-events'
import docs from './docs'
import files from './files'
import folders from './folders'
import sheets from './sheets'
import * as utils from './utils'

const { clear, randomBanner, print } = runtime.cli

/** @type {Object<String,*>} */
const ARGV = runtime.argv

/** @type {Array<String>} */
const argvCommands = ARGV._

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
        await calendarEvents(subcommands.slice(1), options) 
      } else {
        await calendars(subcommands, options)
      }
      break
      
    case 'calendar-events':
      await utils.authorize([], options)
      await calendarEvents(subcommands, options) 
      break

    case 'calendars':
      await utils.authorize([], options)
      await calendars(subcommands, options)
      break

    case 'doc':
    case 'docs':
    case 'documents':
      await utils.authorize([], options)
      await docs(subcommands, options)
      break

    case 'files':
      await utils.authorize([], options)
      await files(subcommands, options)
      break

    case 'folders':
      await utils.authorize([], options)
      await folders(subcommands, options)
      break

    case 'sheets':
    case 'spreadsheets':
      await utils.authorize([], options)
      await sheets(subcommands, options)
      break

    default:
      utils.help(subcommands, options)
  }
}

main.help = (...args) => utils.help(...args)

main.subcommands = {
  calendars,
  calendarEvents,
  docs,
  files,
  folders,
  sheets,
}

export { utils }

export default main
