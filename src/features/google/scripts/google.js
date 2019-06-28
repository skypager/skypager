const runtime = require('@skypager/node')

const calendars = require('./calendars')
const docs = require('./docs')
const files = require('./files')
const sheets = require('./sheets')
const utils = require('./utils')

main()

async function main() {
  const subcommand = runtime.argv._[0]
  const subcommands = runtime.argv._.slice(1)
  const options = runtime.argv
  const { clear, randomBanner, print } = runtime.cli

  clear()
  randomBanner('Skypager')
  print('Google Integration CLI')

  switch (subcommand) {
    case 'authorize':
      await utils.authorize(subcommands, options)
      process.exit(0)
      break

    case 'calendar':
    case 'calendars':
      await calendars(subcommands, options)
      break

    case 'doc':
    case 'docs':
    case 'documents':
      await docs(subcommands, options)
      break

    case 'files':
      await files(subcommands, options)
      break

    case 'folders':
      await files.folders(subcommands, options)
      break

    case 'sheets':
    case 'spreadsheets':
      await sheets(subcommands, options)
      break

    default:
      utils.help(subcommands, options)
  }
}
