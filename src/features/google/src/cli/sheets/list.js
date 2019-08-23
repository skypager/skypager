import runtime from '@skypager/node'

const { defineTable, print } = runtime.cli

const sheetsTable = defineTable('sheetsTable', {
  head: ['Title', 'Owner', 'Last Modified', 'ID'],
})

export async function main(commands = [], options = {}) {
  const { google } = runtime

  await google.whenReady()

  if ((options.server && !google.auth) || (!options.server && !google.oauthClient)) {
    throw new Error(
      `Command requires an authenticated oauth client, or server to server auth setup`
    )
  }

  print(`Listing sheets`)
  const items = await google.listSpreadsheets({
    ...(!options.server && { auth: google.oauthClient }),
    ...(options.mine && { sharedWithMe: false }),
    ...(options.title && { query: `title contains '${options.title}'` }),
    ...options,
  })

  const records = items.map(doc => ({
    id: doc.id,
    title: doc.title,
    lastModifiedBy: doc.lastModifyingUserName,
    lastModifiedAt: doc.modifiedDate,
    owners: (doc.owners || []).map(owner => owner.displayName),
  }))

  if (options.json) {
    if (options.raw) {
      console.log(JSON.stringify(items, null, 2))
    } else {
      console.log(JSON.stringify(records, null, 2))
    }

    return
  }

  records.forEach(rec => {
    sheetsTable.push([
      rec.title,
      rec.owners.join('\n'),
      `${rec.lastModifiedBy}\n${rec.lastModifiedAt}`,
      rec.id,
    ])
  })

  console.log(sheetsTable.toString())
}

export function help(commands = [], options = {}) {
  console.log('sheets list help')
}

main.help = help

export default main
