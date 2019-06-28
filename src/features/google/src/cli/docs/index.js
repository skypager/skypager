import create from './create'
import dump from './dump'
import list from './list'

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

export function help(subcommands = [], options = {}) {
  console.log('docs help', subcommands, options)
}

main.help = help

main.subcommands = {
  create,
  dump,
  list
}

export default main
