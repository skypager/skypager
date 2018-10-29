# Skypager
[![CircleCI](https://circleci.com/gh/skypager/skypager/tree/master.svg?style=svg)](https://circleci.com/gh/skypager/skypager/master)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/j83kh674nbsl3us1/branch/master?svg=true)](https://ci.appveyor.com/project/soederpop/skypager/branch/master)

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

### Helper Options

Each instance of a helper class will have an `options` property that will be composed of several elements.  

The motivation behind this is to support being able to supply configuration / options via package.json config, 
runtime ARGV --command-line-flags as well as javascript runtime objects in the code.

```javascript
const customOptions = { myOption: 'nice' }
// the skypager property in the package.json
const { skypager: packageConfig } = runtime.currentPackage
const { argv } = runtime
const pageModel = runtime.feature('pageModel', customOptions)

pageModel.options === Object.assign(
 // package.json config by default
 packageConfig,
 // the package.json config property that matches the helper instance name next
 packageConfig.pageModel,
 // the command line flags e.g. --my-option=nice override json config
 runtime.argv
 // the custom options passed by the code override anything else
 customOptions
}
```

So in the above example, a script executed with `--my-option=whatever` in a project that has `skypager: { myOption: 'yes' }` would use the value passed to it.

If that was left out, it would use `whatever` from `--my-option=whatever`, and if that was left out,
it would use `skypager.myOption` from the package.json.  If that was left out, then it would be up to the helper class to determine.

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

## Local Development

In order to develop and test this project locally, you will need a service account json for a google cloud project.  It should have the google drive and sheets api's enabled.

In order to run the tests, This file's content needs to either be stored in an environment variable `SERVICE_ACCOUNT_DATA` or you will need to copy this file to

- src/helpers/sheet/secrets/serviceAccount.json
- src/examples/sheets-server/secrets/serviceAccount.json

See our [Circle CI Config](.circleci/config.yml) for an example of how I set up a project in CI to run tests.
