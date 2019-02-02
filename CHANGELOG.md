# CHANGELOG

## Releases

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
