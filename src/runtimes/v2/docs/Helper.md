# Helper

The Helper class is what makes Skypager the Helpful JavaScript framework.  The Helper class provides a container for any types of modules that you or your team define.  As a developer, you continue to write modules which export things, you are just aware of the type of module you are developing and that how that type of module will be represented by its Helper class instance, when it is integrated into the final product and deployed.

You already do this when you decide to put your module in the `src/components` `src/pages` or `src/stylesheets` folder in an app.

The Helper class defines what a component module or page module is, and how an app made of any number of pages and components gets put together.

## Table of Contents

0) Background 
1) What makes a helper
2) Attaching Helpers 
3) Factory Functions 
4) Helper Registries
5) Helper Events

## Background

If you've written any node.js code, you've already worked with a Helper class, called `Module`.  When you `require` a module, you've worked with a [Factory Function](#factory-functions) like the ones I will describe here.  You've already worked with a module registry `require.cache` that is similar to the [one I describe here](#helper-registries)

In node.js, you store your code in files, say `lib/index.js` 

```javascript
module.exports = class MyClass {

}
```

When you `require('./lib/index.js')` the first thing it does is resolve `lib/index.js` to an absolute path, which is that module's unique ID.  It then looks in the `require.cache` to see if that absolute path already has an instance of `Module` loaded.  If it does, it returns that. 

If you have not required that module yet, then you're gonna create that module and access whatever it exports.

When you create a module, it is reading the code at that path as a string, and then wrapping it 

```javascript
Module.wrap(require('fs').readFileSync('/path/to/lib/index.js'))
```

which turns it into

```javascript
(function (module, exports, require, __dirname, __filename) {
  module.exports = class MyClass {

  }  
})(module, module.exports, module.require, require('path').dirname(module.id), module.id)
```

Which is a function that calls your code, with predefined variables in it.  It expects you to modify the module.exports object if you want to return anything to somebody requiring your module.  

You could in theory write your own require

```javascript

function loadMyModule() {
  if (require.cache['/path/to/lib/index.js']) {
    return require.cache['/path/to/lib/index.js']
  }
  
  const module = new Module('/path/to/lib/index.js')
  
  require.cache['/path/to/lib/index.js'] = module

  return module.exports
}

const MyClass = loadMyModule()
```

This module pattern aka commonjs, was invented by the community, and has been the backbone of the JavaScript revolution.  Tools like webpack have the same exact architecture, but for the browser.

## What makes a helper?

The Helper class lets you define a more specific type of Module, and a specific function for loading them, and a registry for knowing which ones are available and requesting the one you want by name.

With an instance of the [Runtime](Runtime.md) and a handful of Helper classes, it is possible to define a single framework dependency that all of your apps can depend on as their only dependency.  You can develop dozens of projects which consist of many modules, and all of those modules can be written by people who you have freed to to focus solely on the value delivered by that code and not on the libraries and tooling that need to be available and wired up in the correct order.

The Helper class is intended to help you make the shapes that universally fit together with all other Lego shapes.  It understands that, with JavaScript itself, and especially with npm, everything can be slightly different and unique, while being very much the same.

## What makes it helpful?

The Helper class gives you the ability to define the patterns and shapes and ways everything fit together, while still being fully adaptable to the nuances and differences of JavaScript you didn't get to write yourself exactly how you wanted it.

A Helper class can define a universal, common API for doing generic things, while delegating the actual responsibility to different implementations of the hard work that exist in the different modules we depend on in our applications. 

These modules might be competing, e.g. you can use google cloud run, AWS, or Lambda to run a function in the cloud.  You can use express or Hapi to host this HTTP server.  

These modules might be from different teams in your organization.  You have two different frontend design teams cranking out themes, one uses Sass and one uses Less.  You might have a Theme helper that just eliminates this distinction from the minds of people who just want the colors to match what the designer requested.

The Helper class makes it easier to componetize things by acting as a standard adapter, or a public API, that smooths over the varities of different styles and APIs that we encounter the more packages we depend on and the more people contribute to our projects. 

As an Architect or Framework author, you can define the high level module patterns that will be used throughout the codebase.  

With a Helper class, you can codify things like:

- A valid Server module is anything that exposes a start function, and listens for HTTP requests on some port.  

-  A valid Client module is anything that 
  - provides functions for interacting with a remote server.   
  - can be configured to talk to different hosts / base URLs
  - can maintain authorization / connection state

- An Authentication Feature module should allow a developer to login to any auth provider's network and let the application know who the current user is, and if they're logged in or not.  It should expose an asynchronous `login` function, an asynchronous `logout` function, and a synchronous `getCurrentUser` function. 

- A Website project should have a package.json, and a folder called pages.  Each page module should export a `default` property that is a valid `React Component`, it should export a string of `path` that is a valid route definition, and a string called `title` that is the page title.

The Helper class is used to define a module type, or pattern.  A module is any JavaScript object that is loaded once, and cached in memory so that subsequent requires of that module are instant.  A module might be a single file in your codebase, it might be a npm module, it might be a whole monorepo.

A module type or pattern specifies, this module can have exports named a, b, and c.  It must have exports named x, y, and z.  Additionally, export a should be a function, export b should be a number, etc.

The instances of the Helper class that get created, have a standard API for working with that module. This says, As a user of the module type, you only need to know about these public functions or properties.

For example:

- a [Feature](Feature.md) gets `enable()`d and exposes `featureMethods`
- a Server gets `configured()` and expects you to call `start()`
- a Client lets you `connect` and then call any available `interfaceMethods`

Every feature, server, client, under the hood, can be entirely different.

As an Architect, you want to be nevertheless be able to combine different projects / packages together very easily with out having to dive into the details of every component.  You describe what a thing does and how it is used within the program, the Helper's API handles the particulars of offloading the details to an implementation module, letting you use the friendly API you want instead.

## Example Server Helper

If the helper is named Server, we can assume the following API will exist.

```javascript
runtime.servers.register('app', () => require('./servers/app'))
runtime.servers.register('app1', () => require('./servers/app1'))

const server1 = runtime.server('app', { port: 3000 })
const server2 = runtime.server('app1', { port: 3001 })
```

This is the default behavior

```javascript
class Server extends Helper {
  // if left unspecified, will be stringUtils.singularize(this.name).toLowerCase()
  static factoryName = 'server'
  // if left unspecified, will be stringUtils.pluralize(this.name).toLowerCase()
  static registryName = 'servers'
}

runtime.use(Server)
```

The Server Helper in this example creates instances of a server, backed by a helper implementation module.

The heler implementation module is responsible for configuring the backend API framework, which by default will be express but can be swapped out for Hapi.

```javascript
import { startExpress, createExpress } from 'some-default-express-implementation'

class Server extends Helper {
  static defaultOptions = {
    port: 3000,
    hostname: 'localhost' 
  }

  static optionTypes = {
    port: types.number.isRequired,
    host: types.string.isRequired
  }

  static providerTypes = {
    create: types.func,
    start: types.func,
    appDidMount: types.func.isRequired
  }  
  
  async appWillMount(app) {
    const { appDidMount } = this.provider 
    await appDidMount.call(this, this.options, this.context)
    return this
  }

  create(options) {
    if (this.app) {
      return this.app
    }

    const { create = createExpress } = this.provider

    const app = create({ this.options, ...options })

    return app
  }

  async start(options = this.options) {
    const { start = startExpress } = this.provider
    const app = this.create(options) 
    await start(app, { port, hostname })

    return this
  }
}
```

Now any module can provide the implementation details which make this heper work.

We might have:

1) A module which accepts the default express provider for http routing

```javascript
runtime.servers.register('app', () => {
  port: 3000,
  appWillMount(app) {
    app.get('/products', (req, res) => {
      res.json({ products: [{ name: 'Food' }]})
    })
  }
})
```

2) An module that didn't get the memo about getting express for free, or maybe wants to use its own express version

```javascript
runtime.servers.register('express-server', () => {
  create: () => {
    const express = require('express-fork')
    const app = express()
    // configure some express stuff
    return app
  },
  start: (app, { port, hostname }) => {
    return new Promise((resolve, reject) => {
      app.listen(port, hostname, (err) => {
        err ? reject(err) : resolve(app)
      })
    })
  },
  appWillMount: (app) => {
    const db = runtime.feature('db')

    return app
      .get('/api/products', async (req, res) => {
        const products = await db.listProducts(req.query)
        res.json(products)
      })
  }
})
```

3) Somebody who just doesn't like express and wants to use Hapi Server instead

```javascript
import Hapi from 'hapi'

runtime.servers.register('hapi-server', () => {
  create: (options = {}) => {
    const app = new Hapi.Server()
    app.conection({ port: options.port || 3000 })
    return app
  },
  start: (app, { port, hostname }) => {
    return new Promise((resolve, reject) => {
      app.start((err) => {
        err ? reject(err) : resolve(app)
      })
    })
  },
  appWillMount: (app) => {
    const db = runtime.feature('db')

    return app
      .route({
        method: 'GET',
        path: '/products',
        handler: async (req, res) => {
          const products = await db.listProducts()
          res(products)
        }
      })
  }
}
```

The `Server` helper lets you work with each completely different implementation, even with different underlying frameworks, in the same way:

```javascript
const express = runtime.server('express-server', {
  port: 3000
})

const hapi = runtime.server('hapi-server', {
  port: 3000
})
```

And without any options at all, you could be providing your own opinionated set of defaults as we are here by choosing express.

```javascript
const standardApp = runtime.server('app')
```

This was just an example.  This document will contain the specifics on how to build your own helpers.


## What makes a good Helper?

Helpers are designed to make working with JavaScript modules more intentional.  Instead of treating every JavaScript module as the lowest common denominator of some named object that you can import that provides some functions, classes, and APIs, the Helper lets you define your own types of modules which export specific, agreed upon named functions, classes, and data.  Instead of being bound by the limitations of bundlers which discourage dynamic imports in favor of statically analyzable imports, Helpers take care of these concerns for you and let developers use consistent, friendly APIs for loading these specific dependencies.

As an Architect or Framework Author, Helpers can provide observable state, events, pub sub, dependency injection, and a bunch of other useful techniques in the context of any pure low-level module.  

This lets you tap into an implementation however you need to, to provide a normalized API, state, and events to any consumer of the helper, or to take advantage of the observability to instrument it for logging, metrics, error monitoring, etc.     

As a developer,   

Instead of wiring up an express server through module boilerplate, you would just say

```javascript
const app = runtime.server('express')
```

and get something you can start

```javascript
await app.start()
```

The helper would read your project, find endpoints, and wire them all up for you.

## Attaching Helpers

Helper classes are intended to be attached to a [Runtime](Runtime.md) instance.  

A runtime instance provides all of the necessary hooks into the underlying platform features and functionality, links to all other helpers and their registries and factory functions, as well as a global event bus and state machine.

In the example below, we define a Server class 

```javascript
class Server extends Helper {
  static isValidRuntime(runtime) {
    if (runtime.networking && typeof runtime.networing.findOpenPort === 'function') {
      return { pass: true }
    }

    return {
      pass: false,
      result: 'We need access to the runtime.networking feature to find an open port'
    }
  }

  static attach(runtime, options = {}) {
    if (!this.isValidRuntime(runtime).pass) {
      console.error(`Must enable the networking feature to find an open port`)
      // exit the process 
      process.exit(1)
    }

    Helper.attach(runtime, options)
  }
}
```

which gets attached by

```javascript
runtime.use({
  attach: Server.attach
})
```

This creates our registry and factory function, which is how we build instances of our helpers.

## Factory Function

Once attached to a runtime, a Helper class creates a special function on the runtime that I refer to as the Helper factory function.

For example, the [Feature](./Feature.md) creates a function `feature` on the runtime.

```javascript
const vmFeature = runtime.feature('vm', {
  requireFunction: (moduleId) => require(moduleId)
})
```

Compared with creating instances of this class with the constructor, the factory function as an API choice offers the following advantages.

- [Memoization / Caching](#cacheable-helpers) When we use the factory method instead of the constructor, we can optimize cases where only one instance of that feature is expected or required 
- [Events](#helper-events) We can notify the global Runtime or Helper event busses that instances of a particular helper have been created.
- [Runtime Type Checking](#runtime-type-checking) the factory method gives automatic runtime type checking without you having to code your own validation logic, just declare the types on the class like you do React components
- [Default Options](#default-options) options can be set from command line flags or process environment variables, the factory method gives us a point to tap into that lets us automatically wire up this behavior for our helpers
- Ability to use the Decorator Pattern.  For example, say we want to provide all instances of helpers with a logging mechanism.  We can define the properties on the instances as a mixin more easily by being able to tap into the helper creation in the factory function.

## Helper Registry 

The Helper Registry is something a Helper class creates an instance of on the runtime it is attached to.  Since the Helper class is a module type, or pattern, the registry contains named functions that provide module implementations of that helper.  

For example, take the following Client helper example 

```javascript
import runtime from '@skypager/runtime'
import Client from '@skypager/helpers-client'

export default runtime
  .use(Client)
  .use((next) => {
    Promise.all([
      import("@skypager/clients-github").then((githubClient) => runtime.clients.register('github', () => githubClient))
      import("@skypager/clients-npm").then((npmClient) => runtime.clients.register('npm', () => npmClient))
    ]).then(() => {
      next()
    })
  })
```

We've used the `Client` helper, and registered two separate client providers with the clients registry.

We can check that they're available

```javascript
console.log(runtime.clients.available) // => ['npm','github']
```

Now, we can create those clients by name.  Note, if you run the following line of code multiple times, each object will be the same instance:

```javascript
const github = runtime.client('github', { token: process.env.GITHUB_API_TOKEN })
```

If you were to use a different token, it would be a different instance.  [See Cacheable Helpers](#cacheable-helpers) for more info about this.

The Registry is modeled after node.js standard require.cache which stores instances of all the Modules you require

## Important Note about Minification

The design of the helper system is designed to take full advantage of the assumed relationship between file names, class names, and singular and plural versions of these names.

For example, the `Server` helper attaches to the runtime, and creates a factory function in the singular, lowercase form: `runtime.server()` and a registry instance in the pluralized, lowercase form `runtime.servers`

We can only do this automatically for you if your class name is not minified at runtime.  If you wish to minify your class names, you can specify these names manually

```javascript
class Document extends Helper {
  static factoryName = 'doc'
  static registryName = 'docs'
}
```

See the next section about [Helper Class Attributes](#helper-class-attributes) for more information.

## Helper Class Attributes

The Helper class is intended to be subclassed.  Certain static properties on the class can be used to control various behaviors.  This section will cover the ones you need to know about

```javascript
import { types, Helper } from '@skypager/runtime'

export class Server extends Helper {
  static isCacheable = true 
  static asyncMode = false
  static strictMode = false 

  static defaultOptions = {
    cors: true,
    serveStatic: true
  }

  static optionTypes = {
    cors: types.boolean,
    serveStatic: types.oneOf([
      types.bool,
      types.string
    ]),
    hostname: types.string.isRequired,
    port: types.oneOf([
      types.number, 
      types.shape({ then: types.func })
    ]).isRequired,
  }
}
```

### Strict Mode 
> `static strictMode = true`

A Helper has three different types of data, `options`, `context`, and `provider` for which runtime type validation can take place

- `options` refers to the object that the helper instance is initialized with
- `context` refers to the object that is passed down by the runtime, it will include references to the runtime, the runtime's state, and any dependencies that the runtime injects.  Helper instances themselves can pass down their own context.
- `provider` refers to the module that was registered with the Helper registry.  This refers to some static, cacheable javascript object (i.e. a module you import).

At a Helper class level, you can define types using the same `prop-types` you use for React Components.

```javascript
import { types, Helper } from '@skypager/runtime'

class Server extends Helper {
  static strictMode = true

  static contextTypes = {
    runtime: types.runtimeWith({
      networking: types.shape({
        findOpenPort: types.func.isRequired
      }).isRequired
    }).isRequired 
  }

  static optionTypes = {
    port: types.number,
  }

  static providerTypes = {
    createServer: types.func,
    appWillMount: types.func,
    appDidMount: types.func,
  }
}
```

### Runtime Type Checking

When `strictMode = true` then any attempt to register a server module that doesn't conform to the provider spec will throw an error.  Any attempt to create a server instance without providing a valid argument for port will throw an error.  An attempt to create the server on a runtime which doesn't have the `networking` feature enabled already will throw an error.

You can use these protections to enforce a convention for registerable modules, and code which attempts to create Helper instances of them to follow.

If you don't want to be strict, you can use the [checkTypes API](#check-types) to enforce them with warnings or whatever way you want.

### Cachable Helpers 
> `static isCacheable = true`

```javascript
import runtime from '@skypager/node'

class Server extends Helper {
  static isCacheable = true
}

runtime.use(Server)
```

Since helpers are often used to represent modules, it makes sense to allow them to behave similar to the module cache, which makes it so when you require a module it only runs the code once and saves the result.

When we use the Server helper to represent an "instance" of the server, whose code lives in a module we require, the most common assumption would be that there is only one server.  

If your code is asking to talk to it by name, it should be safe to assume that it will always get the same thing, in the same state.

When a Helper defines `isCacheable=true` this enables this type of memoization in the helper's factory function that it attaches to the runtime.

So when you have the two lines of code:

```javascript
// the Server factory function
const server0 = runtime.server('app', { port: 3000 })
// Called with the same exact args
const server1 = runtime.server('app', { port: 3000 })
```

You'll notice that they have the same uuid

```javascript
if (server0.uuid !== server1.uuid) {
  throw 'Caching is not working.'
}
```

This is because the arguments are the same to the factory function.  If you were to say 

```javascript
const server0 = runtime.server('app', { port: 3000 })
const server1 = runtime.server('app', { port: 3001 })
```

These two servers would be different instances with their own unique uuid, and their own unique state.  We assume you intend for it to be this way,
because you have the two different set of arguments: one is the server that clients connect to on port 3000, the other is the one clients connect to on 3001.

## Async Loaded Modules 
> `static asyncMode = true`

When we're registering modules with the helper registry

```javascript
runtime.servers.register('app', () => require('./servers/app'))
```

We are registering a function which returns a module when requested by its local name "app".

This works fine in node.js environments , because the require isn't run until the last minute.  Since node's require are synchronous, this is still a valid lazy loading / code splitting technique.

However if we're working in the browser, and bundling our code with webpack, we have a Promise based API for dynamic import.  This has the advantage of webpack's code splitting, but changes our API because the registered function will return a promise and not a module, so this is what `asyncMode` solves.

```javascript
const { types } = Helper

class Page extends Helper {
  static asyncMode = true

  static providerTypes = {
    default: types.func.isRequired,
    path: types.string.isRequired,
    title: types.string.isRequired
  }
}

runtime
  .pages
  .register('HomePage', () => import("./pages/HomePage"))
  .register('ContactUsPage', () => import("./pages/ContactUsPage"))
```

When a Helper is declared to have async mode turned on, then it will register the result of that promise, and treat that as the Helper's provider.  

This mode is required if you want to take advantage of the lazy loading design of the helper registry and factory APIs and be able to register modules directly as you import them.  

If you use the standard sync API, you will have to do something like the following if you want code splitting

```javascript
class Page extends Helper {
  static asyncMode = false
}

runtime
.use(Page)
.use(function next() {

})

async function loadPagesWithCodeSplitting() {
  const HomePage = await import("./pages/HomePage")
  const ContactUsPage = await import("./pages/ContactUsPage")

  runtime.pages.register('HomePage', () => HomePage)
  runtime.pages.register('ContactUsPage', () => ContactUsPage)
}
```

otherwise the following would still delay running the home page code until requested

```javascript
import * as HomePage from 'pages/HomePage'
import * as ContactUsPage from 'pages/ContactUsPage'

runtime.pages.register('HomePage', () => HomePage)
runtime.pages.register('ContactUsPage', () => ContactUsPage)
```

but would include both of these pages in the webpack bundle. 
