# Exploring Skypager in a REPL

The Skypager runtime is accessible from the Node REPL environment of any project directory that has a Skypager module as a dependency in `package.json`.

For example, we can go into the `portfolio` monorepo. Make sure to build the project to make sure you have access to all the helper functions.

```bash
yarn build:rest
```

Open up a Node REPL.

```bash
node
```

## Runtime

When we require the Skypager module, we can see its exports. [More on module exports](https://nodejs.org/api/modules.html#modules_module_exports)

```js
> const baseRuntime = require("@skypager/node");
> baseRuntime
Runtime {
  displayName: 'Skypager',
  stateVersion: 10,
  state: [Getter/Setter],
  featureStatus: [Getter/Setter],
  createCodeRunner: [Function: bound ],
  ...
```

There are additional runtimes for Node, Electron, React Native, etc., and these all build on the base `Runtime`.

```js
> const runtime = require("@skypager/node");
> runtime
Runtime {
  ...
  parseArgv: [Function: bound ],
  commandPhrase: [Getter],
  commandBase: [Getter],
  isRunningCli: [Getter],
  matchingCommand: [Getter],
  ...
```

To see all of the properties and methods of the Skypager module you have instantiated, type `runtime.` + `tab` + `tab`

## Helpers

You can also register helpers at setup and not be dependent on the modules that are currently on disk. The helpers will be added onto the instance of Skypager that you have instantiated.

```js
const runtime = require("skypager-runtimes-node");
runtime.use(require("@dais/helpers-page"));
```