const skypager = require('@skypager/node')
const { print } = skypager.cli

async function main() {
  print('Starting File Manager')
  await skypager.fileManager.startAsync()
  print(`File IDs:`, 2)
  print(skypager.fileManager.fileIds, 4)
  print(`Directory IDs:`, 2)
  print(skypager.fileManager.directoryIds, 4)
  print(`File Entries`, 2)
  print(
    skypager.fileManager.fileIds.map(id => {
      const file = skypager.fileManager.file(id)
      return `${id} ${file.path} ${file.dir} ${file.relativeDirname}`
    })
  )
}

main()
