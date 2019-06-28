const runtime = require('@skypager/node')

const print = runtime.argv.json ? () => {} : runtime.cli.print

async function dump(commands = [], options = {}) {
  if (!runtime.googleDocs) {
    const googleDocHelperPath = runtime.packageFinder.attemptResolve('@skypager/helpers-google-doc')

    if (!googleDocHelperPath) {
      console.error(
        `This command depends on @skypager/helpers-google-doc and it does not appear to be installed.`
      )
      process.exit(1)
    }

    runtime.use(require(googleDocHelperPath), {
      serviceAccount: runtime.google.settings.serviceAccount,
      googleProject: runtime.google.settings.googleProject,
    })
  }

  const docTitleOrId = (commands.length && commands.join(' ')) || options.title || options.id

  !options.json && print(`Searching for document ${docTitleOrId}`)

  const documents = await runtime.google.listDocuments({
    ...(!options.server && { auth: runtime.google.oauthClient }),
  })

  const found = documents.find(sheet => {
    const { title, id } = sheet
    return id === docTitleOrId || String(title).toLowerCase() === docTitleOrId.toLowerCase()
  })

  if (found) {
    runtime.googleDocs.register(found.id, () => found)
    !options.json && print(`Dumping ${found.title} document data`)

    const doc = runtime.googleDoc(found.id)
    await doc.load({ remote: true })

    if (options.json) {
      console.log(JSON.stringify(doc.doc, null, 2))
    } else {
      const outputPath =
        options.outputPath ||
        runtime.resolve(
          'google-docs',
          `${found.title.replace(/\s/g, '-').replace(/--/g, '-')}.dump.json`
        )
      print(`Saving doc data dump to ${outputPath}`)
      await doc.dump(outputPath, !!options.pretty)
    }
  } else {
    console.log('not foundd')
  }
}

module.exports = dump
