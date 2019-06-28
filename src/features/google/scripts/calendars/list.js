const runtime = require('@skypager/node')

const { defineTable, print } = runtime.cli

const calendarsTable = defineTable('calendarsTable', {
  head: ['Name', 'Primary ?', 'description', 'id'],
})

module.exports = async function list(subcommands = [], options = {}) {
  const { google } = runtime

  if (!google.oauthClient) {
    throw new Error(`Command requires an authenticated oauth client.`)
  }

  const calendarService = google.service('calendar', { version: 'v3' })

  const { calendarList } = calendarService

  print('Listing calendars')

  const calendars = await calendarList
    .list({
      auth: google.oauthClient,
    })
    .then(response => response.data.items || [])

  const records = calendars.map(cal => ({
    id: cal.id,
    name: cal.summary,
    description: cal.description || cal.summary,
    access: cal.accessRole,
    primary: !!cal.primary,
    selected: !!cal.selected,
  }))

  if (options.json) {
    if (options.raw) {
      console.log(JSON.stringify(calendars, null, 2))
    } else {
      console.log(JSON.stringify(records, null, 2))
    }

    return
  }

  records.forEach(rec => {
    calendarsTable.push([rec.name, rec.primary ? 'YES' : ' ', rec.description, rec.id])
  })

  console.log(calendarsTable.toString())
}
