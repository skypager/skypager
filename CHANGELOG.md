# CHANGELOG

## Releases

### 1.2.1

- [@skypager/cli] all commands support help and --help flags now
- [@skypager/google] extracted all shared google drive code from the helpers-sheet and helpers-google-doc modules into a single module, making it a shared dependency.
- [@skypager/helpers-sheet] use @skypager/google
- [@skypger/helpers-google-doc] use @skypager/google

### 1.1.1

- [@skypager/helpers-document] major upgrade to the module, including API docs
- Added a bunch of projects in the examples directory

### 1.0.0

- All modules ship umd, commonjs, and es module formats
- [@skypager/webpack] uses webpack 4
- [@skypagers/helpers-sheet] full support for adding rows / updating cells
- [Monorepo -> Google Sheet Sync](src/examples/monorepo-sheets) added example for syncing package.json content in the monorepo w/ a google sheet
- [Runnable MDX Example](src/examples/runnable-mdx) added an example for runnable mdx documents

### 0.4.12

- [@skypager/node] - adds socket feature for cross platorm ipc between in node
- [@skypager/runtime] - fixed bug with qbus event emitter once not working properly
- [@skypager/features/package-manager] add scripts and methods for downloading from npm, implement `pacote` for fetching manifests and tarballs
- [@skypager/features-file-manager] add `cacache` wrapper for interity based file system caching 
- [@skypager/helpers-mdx] - utilities for parsing mdx file with ast and structure maps
- [@skypager/helpers-google-doc] - utility for parsing google documents and working with their tree 

### 0.3.5

- [@skypager/helpers-sheet] add support for writing to a google sheet

### 0.3.3

- [@skypager/features-redis] added a redis feature

### 0.2.9

- [@skypager/runtime] you can now call runtime.use(FeatureClass) as a way of registering and enabling a feature

### 0.2.8

- [@skypager/features-browser-vm] added a new feature for running a vm inside a JSDOM context
- [@skypager/features-file-manager] added some new methods and getters on package manager
    - packageManager.remoteVersionMap returns remote package version by name
    - packageManager.remoteEntries returns remote packages
    - packageManager.remoteData returns remote packages
    - usesYarnWorkspaces, usesLerna, yarnWorkspacePatterns, lernaPackagePatterns, hasYarnLock, hasNpmPackageLock

### 0.2.2

- [@skypager/features-file-manager] added hashTree function which gives a reliable checksum of the project file contents

### 0.2.0

- [@skypager/runtime]
    - (enhancement) you can now export a class from your helper provider modules, when the runtime creates your helper it will create an instance of this class 
    - (breaking change) removed automatic lodash mixin application on instances of Runtime and Helper classes.
- [@skypager/node]
    - (enhancement) refactored the features to be class based
- [@skypager/devtools]
    - (enhancement) added a [run-all script](scripts/run-all.js) which can run package tasks in parallel

### 0.1.20

- [@skypager/features-file-manager]
    - (enhancement) added exportGraph() method to packageManager and moduleManager.  This represents the packages as nodes and edges,
    where the edges represent the dependencies between packages (dev dependencies, optional, etc).  This is really useful for visualizing
    the relationships between all of the packages.  Once I'm able to get the dependency between file modules mapped out, i'll do the same for those.

### 0.1.15

- [@skypager/runtime]
    - (bugfix) the node version of @skypager/runtime did not use the babel polyfill

### 0.1.12

- [@skypager/cli]
    - (enhancement) the `skypager` CLI will attempt to search all @skypager packages which have a scripts folder, as well as any other 
    workspace paths (for @scoped projects) which have a scripts folder, when trying to run a command that isn't provided by @skypager/devtools, @skypager/cli, or @skypager/webpack

### 0.1.11

- [@skypager/helpers-server](src/helpers/server)
    - (enhancement) - Added endpoints registry in the server helper.  The endpoints registry allows us to register express route adding functions / middleware, and then load them by name when creating a server.
- [@skypager/webpack](src/devtools/webpack) 
    - (enhancement) - Extracted mdx parser function from the webpack loader, so that it can be used in a standalone way by other libraries
- [@skypager/runtime] 
    - (bugfix) - Fixed bug in vm feature's createScript method

### 0.1.10

- Fixed a bug in the @skypager/runtime web build where it was not working because of webpack's global and process stubs.
- Added a browser based test suite for the @skypager/runtime and @skypager/web builds

**Published Packages**
  - @skypager/cli: 0.1.9 => 0.1.10
  - @skypager/devtools: 0.1.9 => 0.1.10
  - @skypager/webpack: 0.1.8 => 0.1.10
  - @skypager/sheets-server: 0.1.9 => 0.1.10
  - @skypager/features-file-manager: 0.1.2 => 0.1.10
  - @skypager/helpers-repl: 0.1.9 => 0.1.10
  - @skypager/helpers-sheet: 0.1.7 => 0.1.10
  - @skypager/runtime: 0.1.1 => 0.1.10
  - @skypager/node: 0.1.9 => 0.1.10
  - @skypager/web: 0.1.9 => 0.1.10
  
### 0.1.9

- @skypager/node
- @skypager/web - added babel feature to load babel standalone in via cdn tag at runtime
- @skypager/cli
- @skypager/webpack
- @skypager/devtools
