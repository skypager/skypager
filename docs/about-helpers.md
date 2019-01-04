# Helpers 

Skypager provides a class based abstraction called `Helper`, which let us define patterns for working with groups of similar modules.  

A `Helper` is modeled after React, in that it has the concept of `props`, `state` and `context`, and lifecycle hooks which get called when certain events take place.

A `Helper` activates a module, right after the point that you load or require that module from the native runtime (browser globals, commonjs, es modules, etc.).  

To Illustrate:

```javascript
const runtime = require('@skypager/node')
  // extends runtime to add runtime.server() and runtime.servers
  .use(require('@skypager/helpers-server'))

// we can read the file system and automate this too, but for example
runtime.servers.register('api-one', () => require('./apis/one'))
runtime.servers.register('api-two', () => require('./apis/two'))

(async function main() {
  const { api, port } = runtime.argv
  const server = runtime.server(api, { port })

  await server.start({ port })
})()
```

We can run this script

```shell
$ node server.js --api api-one --port 3000
$ node server.js --api api-two --port 3001
```

And as our APIs grow to the hundreds, each one can be started the same exact way.  This is because the runtime, the server idea, the process of how a server is started, is all one "layer" beneath, but shared by, each of the apis: api one, two, three, and beyond. 

### Other Helper Examples

- [The Rest Client Helper](src/helpers/client) - a wrapper around the axios REST client.  As a developer you can write a friendly interface for making calls with axios
- [The Server Helper](src/helpers/server) - a wrapper around any server that can be started and stopped.  By default provides an express server with history api fallback and static file serving enabled.
- [The Feature Helper](src/runtime/helpers/feature.js) - a module that provides an interface to specific functionality on the running platform. Can be `enable()d` or `disable()d`
- [The Google Sheets Helper](src/helpers/sheet) - a module that loads data as JSON from a google spreadsheet.  As a developer you can write an interface for reading, transforming, or updating this data.
- [The Sketch Document Helper](src/helpers/sketch) - a module that lets you load a designers sketch files as javascript modules.  This can be used to power various code generation apps, as well as anything else you can think of.

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
