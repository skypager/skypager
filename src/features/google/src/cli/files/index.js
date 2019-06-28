import list from './list'
import download from './download'

export const title = 'Drive Files'

export const description = 'Work with files in google drive'

export async function main(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  const subcommand = commands[0]

  switch (subcommand) {
    case 'list':
      await list(commands.slice(1), options)
      break
    case 'download':
      await download(commands.slice(1), options)
      break
    default:
      help(commands, options)
  }
}

export function help(subcommands = [], options = {}) {
  console.log('files help', subcommands, options)
}

main.help = help

export const subcommands = (main.subcommands = {
  list,
})

export default main
