# CHANGELOG

## Releases

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
