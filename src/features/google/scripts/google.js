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

  switch (subcommand) {
    case 'authorize':
      await utils.authorize(options)
      break

    case 'calendar':
    case 'calendars':
      await calendars(subcommands, options)

    case 'doc':
    case 'docs':
      await docs(subcommands, options)     

    case 'files':
      await files(subcommands, options)

    case 'folders':
      await files.folders(subcommands, options)

    case 'sheets':
    case 'spreadsheets':
      await sheets(subcommands, options)          

    default:
      utils.help(subcommands, options)
  }
}


