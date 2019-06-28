const runtime = require('@skypager/node')
const create = require('./create')
const list = require('./list')

async function docs(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }
}

function help(subcommands = [], options = {}) {
  console.log('docs help', subcommands, options)
}

docs.help = help

module.exports = docs