module.exports = function help(subcommands = [], options = {}) {
  if (!subcommands.length) {
    displayMainHelp()  
  } else {
    console.log('showing help', subcommands[0])
  }
}

function displayMainHelp() {
  console.log('main help')  
}