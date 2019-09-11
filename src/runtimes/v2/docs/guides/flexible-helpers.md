# Flexible Helpers

The Helper class is an abstraction for working with types of modules.  

Modules are loaded at runtime in JavaScript.  

Modules are just objects. When we create an instance of a Helper using the Factory functions,

```javascript
runtime.features.register('authentication', () => import("@auth-providers/google-cloud"))
runtime.feature('authentication', {
  projectId: process.env.GOOGLE_PROJECT_ID
})
```

We are creating an instance of a class, using a named module "authentication" that has been registered previously, along with options we pull from the environment (a value our code will know nothing about.)  

Helpers can ensure that only one instance represents one combination of options.  

```javascript
const alpha = runtime.feature('auth', { session: "alpha" })
const bravo = runtime.feature('auth', { session: "bravo" })
const rando = runtime.feature('auth', { session: "alpha" })

rando.uuid === alpha.uuid
alpha.uuid !== bravo.uuid
```

It accomplishes this by hashing the options object.  

The fact that the options, and the provider, are both independently cacheable is [important for a other reasons](cacheable-helpers.md) outside the scope of this document.  

But at the time the Helper takes over to do its logic, we don't have to necessarily care if a value or function the Helper depends on comes from the provider, or the options.

While Options are a logical place for values that are used be used for configuration, since they're both available to the constructor, we can also use options for extending or replacing values that the class otherwise depends on from the `provider`.

## Summary of helper data attributes

`this.provider` is the uniquely named object that exists in the module registry.  Helpers are created using this name, and supplied options.  This value will always be the same across multiple instances of the Helper that share the same name.

```javascript
const name = "whatever"
const provider = runtime.features.lookup(name) // { whatever: 1 }
const whatever = new Feature({ name, provider, someOption: 2 }, { runtime })
```

The `provider` will always be an object that can be validated by a hash signature, for versioning, caching or security purposes.  If for no other reason it exists in a registry before it is used, but also because you get this for free with JavaScript modules.

`this.options` is the object that the helper was instantiated with.  

Generally, a lot of values used in `this.options` will be configuration type data.  

Sometimes, a `provider` can export one of the helpers option types value as a default.

```javascript
// app
export const port = 8080
// usage
const server = runtime.server('app', { port: 3000 })
const alt = runtime.server('app')

server.provider.port = 8080
server.options.port = 3000

class Server {
  get port() {
    return this.options.port || this.provider.port
  }  
}

server.port === 3000
alt.port === 8080
```

For convenience, `this.impl` is an object that allows for merging provider and options, giving preference to options.  

If your Helper is ever referencing provider directly, you can reference `this.impl` instead, and allow for overriding any behavior by passing in values to the constructor.

Allowing the helpers to be customized on an instance by instance basis, at constructor time, allows you to offer a very flexible API for your helper.  

## Testable Helpers

One of the ways this flexibility can be used to your advantage, is in testing.  Especially in unit testing, wheere it is common to mock dependencies and remote connections.

Say we have a `Server` helper that lets us create a server object and start it.

```javascript
const appServer = runtime.server('app')
appServer.start()
```

This is the way the server would be used in development and production.

In our test code, we can do something like this:

```javascript
async function mockStart() {
  const server = this
  // whatever 
}

const appServer = runtime.server('app', {
  start: mockStart
})
```

How you take advantage of this is entirely dependent on the type of Helper, as each type of helper could have its own typical split between provider supplied code and data, and option supplied code, data, configuration , etc.