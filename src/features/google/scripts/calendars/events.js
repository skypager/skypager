async function events(commands = [], options = {}) {
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

function help(commands, options = {}) {
  console.log('calendars event help')
}

events.help = help

module.exports = events
