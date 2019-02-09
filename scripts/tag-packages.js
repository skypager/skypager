import runtime from '@skypager/node'

const { clear, print } = runtime.cli
const { defaultsDeep, omit, flatten, entries, groupBy } = runtime.lodash

const groups = {
  cli: 'tools',
  webpack: 'tools',
  devtools: 'tools',
  react: 'runtimes',
  web: 'runtimes',
  node: 'runtimes',
  runtime: 'runtimes',
  sheets: 'apps',
}

async function main() {
  clear()
  await runtime.fileManager.startAsync({ startPackageManager: true })
  const items = list()

  await Promise.all(
    items.map(item => {
      const { name, groupName } = item
      const entry = runtime.packageManager.findByName(name)
      const manifest = omit(entry, '_file', '_packageId')

      const updated = {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: 'Jon Soeder <jon@chicago.com>',
        ...omit(manifest, 'name', 'version', 'description', 'author'),
        skypager: {
          ...(manifest.skypager || {}),
          category: groupName,
        },
      }

      return runtime.fsx.writeFileAsync(entry._file.path, JSON.stringify(updated, null, 2))
    })
  )
}

function list() {
  const scoped = runtime.packageManager.packageNames
    .filter(name => name.startsWith('@skypager'))
    .filter(name => !name.endsWith('/portfolio'))

  const byGroup = groupBy(scoped, name => {
    const parts = name
      .split('/')
      .slice(1)
      .join()
      .split('-')

    if (groups[parts[0]]) {
      return groups[parts[0]]
    }

    if (parts.length === 1) {
      return groups[parts[0]] || 'Unknown'
    } else if (parts[0].endsWith('s')) {
      return parts[0]
    }
  })

  return flatten(
    entries(byGroup).map(([groupName, packages]) =>
      packages.map(name => ({
        name,
        groupName,
      }))
    )
  )
}

main()
