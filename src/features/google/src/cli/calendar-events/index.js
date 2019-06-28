import list from './list'

export const title = 'Calendar Events'

export const description = 'Browse / Create / Update events in a given google calendar.'

export async function main(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  const subcommand = commands[0]

  switch (subcommand) {
    case 'list':
      await list(commands.slice(1), options)
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
