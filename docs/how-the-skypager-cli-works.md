# How The Skypager CLI works

The `skypager` CLI is a node.js script runner that provides the above conveniences when running any script, but it also is designed to make it easier to share re-usable script commands across an entire portfolio of JavaScript projects.  

By this I mean, for any `skypager command`

- It will scan your current project for scripts to run in `scripts/command.js`, 
- it will scan your monorepo or scoped packages if your project name includes a `@scope` prefix, for any modules which have a `scripts/command.js` file. 
- it will scan any `@skypager/*` module found in `node_modules` for `scripts/command.js`.  

Any time any of these scripts uses the `@skypager/runtime` module (or `@skypager/node` or `@skypager/react`), 
these runtime instances will run in the context of the nearest `package.json` file, and will have access to `process.argv` as an object `runtime.argv` as well as node's `process.env`

This makes it easy for extensions to configure themselves based on the current project.

- `skypager.cwd` will point to the directory of the nearest `package.json`
- `skypager.gitInfo.root` will point to the directory of the nearest `.git` folder

This behavior makes it so that the current `package.json` can be used to store settings for the current project.  Whatever is in the `skypager` property in the `package.json` will be treated as `runtime.argv` as a convenience.  

So the `runtime` object you import can be used to tell you info about this specific project. 

If that project has a `skypager.js` file, that file will automatically be loaded and can be used to customize the node.js runtime for that project even further.

These behaviors allow you to write scripts which adapt to the current project they are in.  

This makes it so when you develop a script for one project, it can easily be used by another, either by copy and pasting and duplicating it, or relying on it as a module dependency.

This means you can trend toward less copying and pasting and duplication of code, because you can write scripts and servers which are flexible and rely on the current `package.json`, or on other files following a similar file name conventions.

**How it works:**

When you run 

```shell
$ skypager whatever
```

the CLI will search in the current project folder for `scripts/whatever.js` and run that.

if there is no such file, it will search your package scope.  so for example, if your current `package.json` has a scoped package name `@myscope/my-package`, then it will 
attempt to search every package in your node_modules that starts with `@myscope/`, and for each one that meets the following criteria, possibly run the script: 

- 1) has a `scripts/whatever.js` file 
- 2) has a `myscope.providesScripts` property in the package.json which includes `"whatever"`

  ```javascript
  {
    "name": "@myscope/my-reusable-helper",
    "myscope": {
      "providesScripts": [
        "whatever"
      ]
    }
  }
  ```

if there is no such file in any of your scoped packages, then it will search the `@skypager/*` scope using the same logic.  

Packages like `@skypager/webpack` provide scripts `build`, `start`, and `watch` because it [includes the following scripts](https://github.com/skypager/skypager/tree/master/src/devtools/webpack/scripts).  If this package is installed, it will be added to the search path

if none of the @skypager/* scoped packages has the command, it will search the scripts provided by [@skypager/cli itself](https://github.com/skypager/skypager/tree/master/src/devtools/cli/scripts)

Skypager's CLI is designed with, and uses node's native module resolution, so any of the per project scripts, or reusable scripts, will use the same version of the dependencies and scripts that your package.json and yarn.lock install.

### Skypager CLI Commands

- [console](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/console.js) an enhanced node REPL which auto-resolves promises and loads the skypager node runtime for the current project
- [hash-build](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/hash-build.js) generate a JSON build manifest of all of your build artifacts, their size, hash, timestamps, etc.  calculate a source hash from the current state of your source files.
- [list-all-scripts](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/list-all-scripts.js) provides information about the available scripts that the skypager cli finds in the current project
- [run-all](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/run-all.js) run multiple tasks, including inside of a monorepo, in parallel or sequentially, with various options for managing their output
- [serve](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/serve.js) start a server
- [socket](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/socket.js) spawn a long running runtime process which communicates over a cross-platform domain socket 
- [start-and-test](https://github.com/skypager/skypager/blob/master/src/devtools/cli/scripts/start-and-test.js) a utility for starting one process, and then running another as a test script. will stop the initial process when the test script finishes.

If you've installed [@skypager/webpack](https://github.com/skypager/skypager/tree/master/src/devtools/webpack) you'll get

- [build](https://github.com/skypager/skypager/blob/master/src/devtools/webpack/scripts/build.js) generate a webpack build for the current project.
- [start](https://github.com/skypager/skypager/blob/master/src/devtools/webpack/scripts/start.js) starts a local HMR webpack server for the current project
- [watch](https://github.com/skypager/skypager/blob/master/src/devtools/webpack/scripts/watch.js) run the webpack build compiler in watch mode

If you've installed [@skypager/helpers-document](https://github.com/skypager/skypager/tree/master/src/helpers/document) you'll get

- [generate-api-docs](https://github.com/skypager/skypager/tree/master/src/helpers/document/scripts/generate-api-docs.js) generate markdown from your JSDOC comment blocks 
- [test-code-blocks](https://github.com/skypager/skypager/tree/master/src/helpers/document/scripts/test-code-blocks.js) parses and evaluates your javascript codeblocks in your markdown.  can be used to test your markdown documentation to ensure it is valid.
- [inspect-docs](https://github.com/skypager/skypager/tree/master/src/helpers/document/scripts/inspect-docs.js) provides information about the markdown documents found in the project

Running any of the above commands with the `--help` flag or with the word help, will get you detailed command usage information

example:

```shell
$ skypager socket help
$ skypager socket --help
```
