import calendars from '../calendars'
import calendarEvents from '../calendar-events'
import docs from '../docs'
import folders from '../folders'
import files from '../files'
import sheets from '../sheets'

export default function help(subcommands = [], options = {}) {
  if (!subcommands.length) {
    displayMainHelp()
  } else {
    const subsection = subcommands[0]

    switch (subsection) {
      case 'calendar-events':
        return calendarEvents.help(subcommands, options)     
      case 'calendars':
        return calendars.help(subcommands, options)
      case 'docs':
        return docs.help(subcommands, options)
      case 'files':
        return files.help(subcommands, options)
      case 'folders':
        return folders.help(subcommands, options)
      case 'sheets':
        return sheets.help(subcommands, options)
      default:
        return displayMainHelp(subcommands, options)
    }
  }
}

function displayMainHelp(subcommands = [], options = {}) {
  console.log('main help')
}
