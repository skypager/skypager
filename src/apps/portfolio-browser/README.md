# Skypager Portfolio Browser

This app uses the following components:

- [@skypager/features-package-manager](../../features/package-manager)
- [@skypager/features-module-manager](../../features/module-manager)

To let you browse the module graph of the @skypager portfolio / monorepo, as well as all of its various npm dependencies.

## Graph Explorer

We generate graph data structures based on the package.json found in the module graph (node modules) or the package graph (monorepo subprojects)

```javascript
const runtime = require('@skypager/node')

await runtime.fileManager.startAsync()
await runtime.packageManager.startAsync()
await runtime.moduleManager.startAsync()

const packageGraph = await runtime.packageManager.exportGraph()
const moduleGraph = await runtime.moduleManager.exportGraph()
```

These graph data structures are easy to plugin to [Cytoscape](https://js.cytoscape.org)

The Graph Explorer page lets you experiment with different cytoscape layouts, and has an in-progress 
ui for controlling all of the available options for these layouts.

## Running The App

If you've cloned the skypager repo, and have installed the dependencies, then from the root 
you can start this app by runing: 

```shell
$ yarn start portfolio-browser
```

Or if you're in the portfolio-browser folder, then running the following will start the app.

```shell
$ yarn start
```