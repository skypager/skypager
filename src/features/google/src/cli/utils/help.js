import runtime from '@skypager/node'

import { commands } from '../command'

import calendars from '../calendars'
import calendarEvents from '../calendar-events'
import docs from '../docs'
import folders from '../folders'
import files from '../files'
import sheets from '../sheets'

export default function help(subcommands = [], options = {}) {
  if (!subcommands.length) {
    displayMainHelp()
  } else {
    const subsection = subcommands[0]

    switch (subsection) {
      case 'calendar-events':
        return calendarEvents.help(subcommands, options)
      case 'calendars':
        return calendars.help(subcommands, options)
      case 'docs':
        return docs.help(subcommands, options)
      case 'files':
        return files.help(subcommands, options)
      case 'folders':
        return folders.help(subcommands, options)
      case 'sheets':
        return sheets.help(subcommands, options)
      default:
        return displayMainHelp(subcommands, options)
    }
  }
}

function displayMainHelp(subcommands = [], options = {}) {
  const { max, padEnd } = runtime.lodash
  const { print, colors } = runtime.cli

  if (!subcommands.length) {
    const allCommands = commands.allMembers()
    const maxLength = max(Object.values(allCommands).map(({ title }) => title.length))

    Object.entries(allCommands).map(([name, command]) => {
      const title = padEnd(command.title, maxLength)
      print(`  ${colors.bold(title)}\t${command.description}`, 0, 1, 0)
      print(`  $ ${colors.green(`skypager google ${runtime.stringUtils.kebabCase(name)}`)}`, 0, 1, 1)
      print(`    commands: ${Object.keys(command.subcommands).join(', ')}`)
    }) 
  }
}
