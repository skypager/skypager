const runtime = require('@skypager/node')
const events = require('./events')
const list = require('./list')

async function calendars(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  const subcommand = commands[0]

  switch (subcommand) {
    case 'list':
      await list(commands.slice(1), options)
      break
    case 'events':
      await events(commands.slice(1), options)
  }
}

function help(subcommands = [], options = {}) {
  console.log('calendar help', subcommands, options)
}

calendars.help = help

module.exports = calendars
