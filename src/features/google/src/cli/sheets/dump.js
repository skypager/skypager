import runtime from '@skypager/node'

const print = runtime.argv.json ? () => {} : runtime.cli.print

export async function main(commands = [], options = {}) {
  if (!runtime.sheets) {
    const sheetHelperPath = runtime.packageFinder.attemptResolve('@skypager/helpers-sheet')

    if (!sheetHelperPath) {
      console.error(
        `This command depends on @skypager/helpers-sheet and it does not appear to be installed.`
      )
      process.exit(1)
    }

    runtime.use(require(sheetHelperPath), {
      serviceAccount: runtime.google.settings.serviceAccount,
      googleProject: runtime.google.settings.googleProject,
    })
  }

  const sheetTitleOrId = (commands.length && commands.join(' ')) || options.title || options.id

  !options.json && print(`Searching for spreadsheet ${sheetTitleOrId}`)

  const spreadsheets = await runtime.google.listSpreadsheets({
    ...(!options.server && { auth: runtime.google.oauthClient }),
    ...(options.mine && { sharedWithMe: false }),
  })

  const found = spreadsheets.find(sheet => {
    const { title, id } = sheet
    return id === sheetTitleOrId || String(title).toLowerCase() === sheetTitleOrId.toLowerCase()
  })

  if (found) {
    runtime.sheets.register(found.id, () => found)
    !options.json && print(`Dumping ${found.title} sheet data`)

    const sheet = runtime.sheet(found.id)
    await sheet.whenReady()
    await sheet.loadAll()

    if (options.json) {
      console.log(JSON.stringify(sheet.data, null, 2))
    } else {
      const outputPath =
        options.outputPath ||
        runtime.resolve(
          'sheets',
          `${found.title.replace(/\s/g, '-').replace(/--/g, '-')}.dump.json`
        )
      print(`Saving sheet data dump to ${outputPath}`)
      await runtime.fsx.mkdirpAsync(runtime.pathUtils.dirname(outputPath))
      await runtime.fsx.writeFileAsync(outputPath, JSON.stringify(sheet.data), 'utf8')
    }
  } else {
    console.log('not foundd')
  }
}

export function help(commands = [], options = {}) {
  console.log('sheets dump help')
}

main.help = help

export default main
