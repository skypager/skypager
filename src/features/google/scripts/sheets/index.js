const create = require('./create')
const list = require('./list')

async function sheets(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }  
}

function help(commands = [], options = {}) {
  console.log('sheets help', commands, options)
}

sheets.help = help

module.exports = sheets