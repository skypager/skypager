require('./install-secrets')

const runtime = require('@skypager/node')

// spawn a runtime instance in the root of the repo, instead of the current directory
const serviceAccountPath = runtime.resolve('secrets', 'serviceAccount.json')
const serviceAccount = runtime.fsx.readJsonSync(serviceAccountPath)

runtime
  .use(require('@skypager/helpers-sheet'), {
    serviceAccount: serviceAccountPath,
    googleProject: serviceAccount.project_id,
  })
  .use(require('@skypager/helpers-document'))
  .use(require('./content-manager'))

const {
  sheetTitle,
  sheetKey = sheetTitle &&
    runtime.stringUtils.camelCase(runtime.stringUtils.kebabCase(String(sheetTitle))),
  sheetName = 'siteCopy',
} = runtime.argv

// Currently the sheets-helper entities have a bug where empty cells don't get indexed.
// When creating the sheet this converts each empty value into the string $EMPTY so that we can change it
const EMPTY = '$EMPTY'

async function main() {
  if (runtime.argv.help || runtime.argv._[0] === 'help') {
    displayHelp()
    process.exit(0)
  }

  await runtime.sheets.discover()

  if (runtime.argv.open) {
    const siteCopy = runtime.sheet(sheetKey)

    await siteCopy.whenReady()

    const driveFile = await monorepo.tryResult('getDriveFile', {})

    if (driveFile && driveFile.alternateLink) {
      Promise.resolve(runtime.opener.openInBrowser(driveFile.alternateLink))
    }

    process.exit(0)
  }

  // start the file and package manager features, so we can get access to all of the package entities
  await runtime.fileManager.startAsync()
  await runtime.contentManager.start()

  // finds all of the sheets shared with the client_email address in the service account JSON
  await runtime.sheets.discover()

  const {
    // the projects worksheet in our
    worksheet,
    // the sheet itself
    siteCopy,
    // the content elements
    content,
  } = await loadSiteCopy()

  // Get the package entities for all of the packages in our monorepo's scope

  // run the script with --console to start REPL to be able to inspect the data
  if (runtime.argv.console) {
    await runtime.repl('interactive').launch({ runtime, siteCopy, worksheet, content })
    return
  }

  if (runtime.argv.inbound || runtime.argv._[0] === 'inbound') {
    console.log('Updating Local Files from the Spreadsheet')
    await updateLocal({ siteCopy, content, worksheet })
  } else {
    console.log('Updating the spreadsheet with local file state')
    await updateRemote({ siteCopy, worksheet })
  }
}

const splice = str => (start, length, replacement) =>
  str.substr(0, start) + replacement + str.substr(start + length)

async function updateLocal({ siteCopy, content, worksheet } = {}) {
  const { pickBy, values, keyBy } = runtime.lodash
  const local = await scanProject()

  const localNodes = keyBy(local, 'nodeId')
  const remoteNodes = keyBy(content, 'nodeId')

  const updateQueue = values(
    pickBy(localNodes, (local, nodeId) => {
      const remote = remoteNodes[nodeId]
      return remote && local.value !== remote.value && local.fileHash === remote.fileHash
    })
  ).map(localNode => ({
    script: runtime.script(localNode.file.replace(/\.js$/, '')),
    file: localNode.file,
    nodeId: localNode.nodeId,
    from: localNode.value,
    to: remoteNodes[localNode.nodeId].value,
  }))

  for (let update of updateQueue) {
    const { nodeId, script, nodeType, from, to } = update
    const [startLine, startCol, endLine, endCol] = nodeId.split(':').map(v => parseInt(v, 10))
    const [updateNode] = script.findNodes(({ node }) => {
      const { start, end } = node.loc

      if (
        start.line === startLine &&
        end.line === endLine &&
        start.column === startCol &&
        end.column === endCol
      ) {
        return true
      }
    })


    if (updateNode) {
      const isMultiLine = endLine - startLine > 0

      if (!isMultiLine) {
        const lines = script.lines
        const updateLine = lines[startLine - 1]
        const newLine = splice(updateLine)(startCol + 1, endCol - startCol - 2, to)
        lines[startLine - 1] = newLine
        script.state.set('content', lines.join('\n'))
      } else {
        console.log('Multiline replacements TODO')
      }

      // How do i now edit the node and update the source code?
      // I could use the script.lines object, and do string replacement for the start: { line, column }, end: { line, column } range
    }
  }

  const seen = {}

  for (let update of updateQueue) {
    if (!seen[update.file]) {
      console.log(`Updating ${update.file}`)
      seen[update.file] = true
    }

    const { script } = update
    await runtime.fsx.writeFileAsync(script.file.path, script.state.get('content'), 'utf8')
  }
}

async function scanProject() {
  const { flatten } = runtime.lodash
  const components = await loadComponentFiles()
  const processed = await Promise.all(components.map(component => processFile(component)))

  return flatten(processed)
}

async function updateRemote({ siteCopy, worksheet }) {
  const { flatten, mapKeys } = runtime.lodash
  const components = await loadComponentFiles()
  const processed = await Promise.all(components.map(component => processFile(component)))
  const records = flatten(processed)

  for (let record of records) {
    const transformed = mapKeys(record, (v, k) => runtime.stringUtils.underscore(k))

    await worksheet.addRow(transformed).catch(error => {
      console.error(`Error adding`, error.message, record)
    })
  }
}

function processAstPath(path, options = {}) {
  const { get, at } = runtime.lodash
  const parentType = get(path, 'parent.type')
  const parentName = get(path, 'parent.name.name')
  const loc = get(path, 'node.loc')
  const nodeId = at(loc, 'start.line', 'start.column', 'end.line', 'end.column').join(':')

  return {
    node: path.node,
    loc,
    lineNumber: get(loc, 'start.line'),
    nodeId,
    parent: path.parent,
    parentType,
    nodeType: path.node.type,
    ...(parentName && { parentName }),
    value: path.node.value,
    path() {
      return path
    },
  }
}

async function processFile(script, options = {}) {
  const { attributeNames = ['content'] } = options
  const { get, pick } = runtime.lodash

  const stringLiterals = script.findNodes(node => node.type === 'StringLiteral')

  const jsxAttributes = stringLiterals
    .filter(path => {
      const parentType = get(path, 'parent.type')
      const parentName = get(path, 'parent.name.name')

      return parentType === 'JSXAttribute' && attributeNames.indexOf(parentName) > -1
    })
    .map(result => ({
      ...processAstPath(result, options),
      fileHash: script.file.hash,
      file: script.file.relative,
      projectName: runtime.currentPackage.name,
    }))

  const jsxText = script
    .findNodes(node => node.type === 'JSXText')
    .filter(path => {
      const parentType = get(path, 'parent.type')
      const value = get(path, 'node.value')

      return (
        value &&
        parentType === 'JSXElement' &&
        String(value)
          .replace(/\s*/g, '')
          .trim().length
      )
    })
    .map(result => ({
      ...processAstPath(result, options),
      fileHash: script.file.hash,
      file: script.file.relative,
      projectName: runtime.currentPackage.name,
    }))

  const results = [...jsxAttributes, ...jsxText].map(result =>
    pick(result, 'projectName', 'file', 'fileHash', 'nodeId', 'value', 'lineNumber', 'nodeType')
  )

  return results
}

async function loadComponentFiles() {
  const components = await runtime.contentManager.sourceModules.filter(({ file }) =>
    file.relative.match(/^src.(pages|components)/)
  )

  return components
}

async function loadSiteCopy() {
  const siteCopy = runtime.sheet(sheetKey)

  siteCopy.enableAutoSave()

  await entities(siteCopy)

  const worksheet = await siteCopy.ws(sheetName)

  const content = worksheet.entities

  return {
    siteCopy,
    worksheet,
    content,
  }
}

async function entities(sheet) {
  class ContentElement extends sheet.RowEntity {
    get startPosition() {
      const parts = String(this.nodeId).split(':')

      return {
        line: parts[0],
        col: parts[1],
      }
    }

    get endPosition() {
      const parts = String(this.nodeId).split(':')

      return {
        line: parts[2],
        col: parts[3],
      }
    }
  }

  await sheet.whenReady()

  try {
    return sheet.registerEntity(sheetName, () => ContentElement)
  } catch (error) {
    console.log(sheet.worksheetIds, sheet.worksheetTitles)
  }
}

function displayHelp() {
  const { clear, colors, randomBanner } = runtime.cli

  clear()
  randomBanner('Sync')

  const message = `
  ${colors.bold.underline('@skypager/ ui copy spreadsheet sync')}

  --sheet-title   the title of the sheet (no spaces, lowercase, no punctuation)
  --sheet-id      the id from the url (not required if using sheet-key)
  --inbound       update the local files instead of populating the sheet
  --open          open the sheet in a browser 

  ${colors.bold('Example')}

  # open the sheet in a browser
  $ skypager sync --open --sheet-title skypager-ui-copy-manager

  # updates the google sheet with the content from your components 
  $ skypager sync --sheet-title skypager-ui-copy-manager

  # updates the local files with the content from google sheet
  $ skypager sync --sheet-title skypager-ui-copy-manager 
  


  `

  console.log(message.trim())
  console.log('')
}

main()
