const runtime = require('@skypager/node')
const create = require('./create')
const list = require('./list')

async function docs(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  const subcommand = commands[0]

  switch (subcommand) {
    case 'list':
      await list(commands.slice(1), options)
      break
    case 'create':
      await create(commands.slice(1), options)
  }
}

function help(subcommands = [], options = {}) {
  console.log('docs help', subcommands, options)
}

docs.help = help

module.exports = docs
