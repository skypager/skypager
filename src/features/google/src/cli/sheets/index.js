import runtime from '@skypager/node'
import create from './create'
import dump from './dump'
import list from './list'

const { colors, print } = runtime.cli

export const title = 'Google Sheets'

export const description = 'Create, Download, Modify google spreadsheets and their data'

export async function main(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  const subcommand = commands[0]

  switch (subcommand) {
    case 'list':
      await list(commands.slice(1), options)
      break
    case 'dump':
    case 'export':
      await dump(commands.slice(1), options)
      break
    case 'create':
      await create(commands.slice(1), options)
      break
    default:
      help(commands, options)
  }
}

function help(subcommands = [], options = {}) {
  const cmd = subcommands[0]

  if (cmd && main.subcommands[cmd]) {
    main.subcommands[cmd].help(subcommands, options)
    return
  }

  print(colors.bold.underline('Sheets Commands'), 0, 1, 1)
  print(`
    The sheets commands provide a CLI interface for browsing your google spreadsheets.  You can create new ones,
    dump existing ones to JSON, and more.
  `)
  print(colors.bold.underline('Universal Options:'), 0, 0, 1)
  print(`
    --help      show the help for the requested command
    --server    pass this flag to prefer server-to-server auth, if you have client oauth enabled.
  `)
  print(colors.bold.underline('Available Commands:'), 0, 0, 1)
  print(`
    $ skypager google sheets create --help
    $ skypager google sheets dump --help 
    $ skypager google sheets list --help
  `)
}

main.help = help

export const subcommands = main.subcommands = {
  create,
  dump,
  list,
}

export default main
