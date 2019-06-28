import runtime from '@skypager/node'
const { print, colors } = runtime.cli
const { castArray } = runtime.lodash

export async function setup() {
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
}

export async function main(commands = [], options = {}) {
  if (commands[0] === 'help' || options.help) {
    return help(commands, options)
  }

  /** @type {import("../../src/GoogleIntegration").GoogleIntegration} */
  const google = runtime.google

  setup()

  const title = options.title || commands.join(' ')

  let worksheets
  let worksheetData = {}

  if (options.from) {
    const importPath = runtime.resolve(options.from)
    const importData = await runtime.fsx.readJsonAsync(importPath)

    worksheets = Object.entries(importData).map(([title, rows]) => {
      worksheetData[title] = rows
      return [title, Object.keys(rows[0] || {})]
    })
  } else {
    worksheets = castArray(options.worksheet).map(config => {
      const [title, columns] = config.split(':').map(v => v.trim())
      return [title, columns.split(',').map(v => v.trim())]
    })
  }

  const sheet = await google.createSpreadsheet({ title })

  const sheetId = sheet.spreadsheetId

  runtime.sheets.register(sheetId, () => ({
    sheetId,
  }))

  const sheetHelper = runtime.sheet(sheetId, {
    auth: google.oauthClient,
  })

  print(`Loading sheet metadata`)
  await sheetHelper.whenReady()

  for (let worksheet of worksheets) {
    const [title, headers] = worksheet
    print(`Adding worksheet ${colors.green('title')}`)
    print('Headers:')
    print(headers.map(h => `- ${h}`), 4)
    await sheetHelper.addWorksheet({ title, headers, rowCount: 200 })
  }

  await sheetHelper.removeWorksheet(sheetHelper.worksheetIds[0])

  print(`Created new spreadsheet: ${colors.green('title')}`)
  print(`URL: ${colors.bold(sheet.spreadsheetUrl)}`)
  print(worksheets.map(([title, headers]) => `${title}: ${headers.join(', ')}`))

  if (options.open) {
    runtime.opener.openInBrowser(sheet.spreadsheetUrl)
  }

  if (options.from && Object.keys(worksheetData).length) {
    const entries = Object.entries(worksheetData)

    for (let entry of entries) {
      const [id, rows] = entry
      print(`Adding ${id} data. ${rows.length} rows`)
      await Promise.all(rows.map(row => sheetHelper.addRow(id, row)))
    }
  }

  process.exit(0)
}

export function help(subcommands = [], options = {}) {
  print(colors.bold.underline('Create Sheet Command'), 0, 1, 1)
  print(`
    Create a google spreadsheet from the command line.  You can specify worksheet and column metadata
    or create one from an existing data structure.  
    
    Note, this requires the oauth access method.
  `)
  print(colors.bold.underline('Examples'), 0, 0, 1)
  print(`
    $ ${colors.green('skypager google sheets create')} "E-Commerce Store" \\
      --${colors.magenta('worksheet')} "products: sku, title, price" \\
      --${colors.magenta('worksheet')} "inventory: sku, warehouse, location, quantity"
  `)
  print(colors.bold.underline('Options'), 0, 0, 1)
  print(`
    --title [title]               the title for the sheet.
    --from <pathToData>           a path to a JSON object. Should be an object whose keys are worksheet titles, and whose values 
                                  are arrays of objects whose properties match the column headings. 
    --worksheet <configString>    define a worksheet, can be supplied multiple times.

                                  example: 

                                  --worksheet "products: sku, title, description" --worksheet "inventory: sku, quantity"

                                  config string format is sheetName: columnOne, columnTwo, columnThree
                                  the worksheet title comes before the colon, comma separated column names come after
  `)
}

main.help = help

export default main
