# Skypager
[![CircleCI](https://circleci.com/gh/skypager/skypager/tree/master.svg?style=svg)](https://circleci.com/gh/soederpop/skypager-next/tree/master)

Skypager is a universal JavaScript runtime that makes it easy to write applications which run on node, the browser, in react native, or electron.

## Helpers 

Skypager provides a class based abstraction called `Helper`, which let us define patterns for working with groups of similar modules.  

For example:

- [The Feature Helper](src/runtime/helpers/feature.js) - a module that provides an interface to specific functionality on the running platform. Can be `enable()d` or `disable()d`
- [The Google Sheets Helper](src/helpers/sheet) - a module that loads data as JSON from a google spreadsheet.  As a developer you can write an interface for reading, transforming, or updating this data.
- [The Rest Client Helper](src/helpers/client) - a wrapper around the axios REST client.  As a developer you can write a friendly interface for making calls with axios
- [The Server Helper](src/helpers/server) - a wrapper around any server that can be started and stopped.  By default provides an express server with history api fallback and static file serving enabled.

The idea behind, for example, the Server Helper is that applications that work with servers generally want to do three things:

- configure
- start
- stop

So the Server Helper provides these methods as an abstract interface.  You can register any type of module with the `runtime.servers` registry
as long as it is capable of providing implementations for these things.  

```javascript
const runtime = require('@skypager/node')
  .use(require('@skypager/helpers-server'))

runtime.servers.register('app', () => ({
  // enable cors
  cors: true,
  appWillMount(app) {
    // app is express()
    app.get('/api/*', (req, res) => res.json([{ data: 'data' }]))
  }
}))

// the barebones app server provider defined above uses the default implementation of start provided by express().listen()
runtime.server('app').start().then(() => {
  console.log(`Server Started`)
})
```

## Example Projects

Skypager is a powerful framework which can be used to build any kind of app, here are some examples of things we've built:

- [Sheets Server](src/examples/sheets-server) A REST API that lets you browse your google spreadsheets, and request them in JSON form

## Installation

You can install the single package `skypager` which provides the latest versions from the '@skypager/*' portfolio

```shell
$ yarn add 
```

Or you can install the main packages directly

```shell
$ yarn add @skypager/cli @skypager/node @skypager/web
```

## Usage

**Usage with webpack or other bundlers**

```javascript
// this will be either @skypager/node or @skypager/web depending on your build platform
import runtime from 'skypager'

runtime.start().then(() => {
  console.log('Skypager Runtime Is Started')
})
```

**Usage via script tag**

```html
<script type="text/javascript" src="https://unpkg.com/@skypager/web"></script>
<script type="text/javascript">
  skypager.start().then(() => {
    console.log('Skypager Runtime is Ready')
  })
</script>
```
