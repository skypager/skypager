# Skypager Server Helper 

The Skypager Server Helper is used to provide a standard interface on top of any node.js server that you can think of.

By default, we provide an [express](https://expressjs.com) based server, with optional:
  - CORS support 
  - history fallback support 
  - static file serving

This helper is automatically loaded by the [Skypager Node Runtime](../../runtimes/node)

## Helper Interface

A Server Helper module is any module which exports one of our functions or properties

- **cors** export true, or a function which returns true, if you want to enable cors support.  export an object or a function which returns an object to provide options to the cors module.
- **history** export true, or a function which returns true, if you want to enable history api fallback to an index.html file 
- **serveStatic** export true, or a function which returns true, if you want to enable static file serving from the project's build folder.
- **appWillMount** export a synchronous function, this function will be passed an instance of `app` which is usually your express server.  Do whatever you want in this function,
  such as define routes on app
- **appDidMount** export an asynchronous function, this function will be called right before the server starts. use this function to add additional routes,
or do any sort of logic that relies on some asynchronous data
- **serverWillStart** export an asynchronous function, this function will be called after the `appDidMount` hook.  Use this function to prepare any external
services your server might need to connect to when handling requests
- **serverDidFail** export a function which will be called when the server fails to start 
- **displayBanner** export a function which will be used when the server stars to display console output
- **endpoints** export an array or a function which returns an array of endpoint module ids to use.  endpoint modules can be registered with the runtime.endpoints registry

## Registries

With the server helper, you'll have a couple of module registries on your runtime

**Endpoints Registry**

```javascript
runtime.endpoints
// register one at a time
runtime.endpoints.register('my-endpoint', () => require('./my-endpoint'))
// add a webpack require.context
runtime.endpoints.add(require.context('./src/endpoints', true, /\.js$/))
// or use the node runtime's requireContext to create a similar require context object 
runtime.endpoints.add(runtime.requireContext('src/endpoints'))
// see available endpoints
runtime.endpoints.available
```

**Servers Registry**

```javascript
runtime.servers
// register a server module
runtime.servers.register('app', () => require('./server/app.js'))
// retrieve a server module
runtime.servers.lookup('app')
// see all available servers
runtime.servers.available
```