const runtime = require('@skypager/node')
const create = require('./events')
const list = require('./list')

async function calendars(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }  
}

function help(subcommands = [], options = {}) {
  console.log('calendar help', subcommands, options)
}

calendars.help = help

module.exports = calendars