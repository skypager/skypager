const create = require('./create')
const list = require('./list')

async function files(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return filesHelp(commands, options)
  }
}

async function folders(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return foldersHelp(commands, options)
  }
}

function filesHelp(subcommands = [], options = {}) {
  console.log('files help')
}
function foldersHelp(subcommands = [], options = {}) {
  console.log('folders help')
}

files.folders = folders
files.folders.help = foldersHelp

files.help = filesHelp

module.exports = files
