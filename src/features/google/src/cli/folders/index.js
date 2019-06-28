import list from './list'

export const title = 'Drive Folders'

export const description = 'Work with folders in google drive'

export async function main(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  const subcommand = commands[0]

  switch (subcommand) {
    case 'list':
      await list(commands, options)
      break
    default:
      help(commands, options)
  }
}

export function help(subcommands = [], options = {}) {
  console.log('calendar help', subcommands, options)
}

main.help = help

export const subcommands = main.subcommands = {
  list,
}

export default main
