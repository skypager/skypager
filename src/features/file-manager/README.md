# Skypager File Manager Feature

The File Manager provides an interface for browsing / searching / manipulating the file contents inside of a project.

Under the hood it uses `git ls-files` to find all of the files in the project.

## Package Manager

In addition to the file manager, a package manager feature is used to work with all of the package.json manifests that may be found inside a project.

This is especially useful for monorepos and yarn workspaces.

## Module Manager

In addition to the file manager and package manager, the module manager feature is used to work with all of the package.json that can be found in the project's node_modules hierarchy.

## Servers

This feature provides two servers which are implementations of the [Skypager Server Helper](../../helpers/server)

- **File Manager API** - provides a REST API for browsing the project's files.  
- **Package Manager API** - provides a REST API for browsing the project's package.json manifests

## Feature API 

```javascript
import runtime from '@skypager/node'

async function main() {
  // start the file manager
  await runtime.fileManager.startAsync()
  // list all the file ids
  console.log(runtime.fileManager.fileIds)
  // list all the directory ids
  console.log(runtime.fileManager.directoryIds)
  // find a file
  const file = runtime.fileManager.file('package.json')
  console.log(file)

  // find all files matching a route pattern
  const components = runtime.fileManager.matchRoute('src/components/:componentName*.js')

  // calculate the md5 hash of all package.json files
  await runtime.fileManager.hashFiles({
    include: [/package.json$/]
  })

  const hash = runtime.file('package.json').hash
  console.log('hash', hash)
}

main()
```