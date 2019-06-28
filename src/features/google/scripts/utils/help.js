const { help: calendarsHelp } = require('../calendars')
const { help: docsHelp } = require('../docs')
const { help: filesHelp, folders: { help: foldersHelp } } = require('../files')
const { help: sheetsHelp } = require('../sheets')
 
module.exports = function help(subcommands = [], options = {}) {
  if (!subcommands.length) {
    displayMainHelp()
  } else {
    const subsection = subcommands[0]

    switch(subsection) {
      case 'calendars':
        return calendarsHelp(subcommands, options)
      case 'docs':
        return docsHelp(subcommands, options)
      case 'files':
        return filesHelp(subcommands, options)       
      case 'folders':
        return foldersHelp(subcommands, options)       
      case 'sheets':
        return sheetsHelp(subcommands, options)       
      default:
        return displayMainHelp()
    }
  }
}

function displayMainHelp() {
  console.log('main help')
}
