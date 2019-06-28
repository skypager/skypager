import runtime from '@skypager/node'
import { createWriteStream } from 'fs'

const { colors, print } = runtime.cli

export async function main(commands = [], options = {}) {
  const { google } = runtime

  const fileId = commands[0] || options.fileId
  const outputPath = commands[1] || options.outputPath
  const mimeType = options.mimeType || options.format

  if (!fileId || !outputPath || !mimeType) {
    print(colors.red('Missing required parameters'))
    print(`
    
    file id and output path can be supplied positionally, or via flags

    $ skypager google files download $fileId $outputPath --mime-type
  
    --output-path
    --mime-type
    --file-id
    `)

    process.exit(1)
  }

  const drive = google.service('drive', {
    version: 'v2',
    ...(options.server ? {} : { auth: google.oauthClient }),
  })

  const dest = createWriteStream(runtime.resolve(outputPath))

  print(`Downloading ${colors.bold(fileId)} as ${mimeType} to ${outputPath}`)

  await new Promise((resolve, reject) => {
    drive.files.export(
      {
        fileId,
        mimeType,
      },
      { responseType: 'stream' },
      (err, response) => {
        if (err) {
          reject(err)
          return
        }

        response.data
          .on('error', err => reject(err))
          .on('end', () => resolve())
          .pipe(dest)
      }
    )
  }).catch(error => {
    print(colors.red('Error downloading file'))
    print(error.message)
    print(error.stack, 8)
    process.exit(1)
  })

  print(`Downloaded file ${colors.green('OK')}`)
  print(`  Saved file in:`)
  print(`  ${colors.bold(outputPath)}`)
}

export function help(commands, options = {}) {}

main.help = help

export default main
