const create = require('./create')
const list = require('./list')
const dump = require('./dump')

async function sheets(commands = [], options = {}) {
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
    case 'create':
      await create(commands.slice(1), options)
  }
}

function help(subcommands = [], options = {}) {
  console.log('sheets help', subcommands, options)
}

sheets.help = help

module.exports = sheets
