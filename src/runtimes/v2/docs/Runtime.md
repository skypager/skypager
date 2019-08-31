# Runtime

The JavaScript language works by providing a runtime that contains certain global objects or services,
such as `window`, `document`, `process`, or `require` from which your code can build a larger application, which
as a developer you distribute as scripts or modules to be executed by the Browser or Node.js, or whatever runtime. 

The `Runtime` class lets you define the behavior of your own universal / platform agnostic global service
object, typically `global.runtime`.  This global singleton can delegate different tasks to the native
services (e.g. `window`, `process`, `require`), or third party APIs, load dependencies and polyfills automatically, 
provide global observable state, event busses, etc.

Your application code can talk to this runtime service, instead of directly to the underlying environment.

This will allow your applications to be portable and platform agnostic to a large extent, and will make it easier
to develop reusable modules and components.

This also allows you to distribute your application and its dependencies in discrete, cacheable chunks that get
loaded at the right time, with the right dependencies and state available.

## Inheritance

Runtime extends the [Entity](Entity.md) class, which provides it with an observable state object, and event
emitter APIs.  The [Helper](Helper.md) class also extends Entity.  The Runtime is considered a `Root Entity`. 

Helpers are child components which get created by the Runtime.  You build a Runtime distribution by declaring
which helpers are needed.

## APIs

### Runtime State 

The runtime singleton instance has a `setState` API with similar semantics to React's `setState` API.

```javascript
runtime.setState({ newState: true })

runtime.setState((current) => ({
  ...current,
  newState: true
}))

runtime.setState({ newState: false }, () => {
  runtime.emit('weGotNewState')
})
```

You can also observe the state object

```javascript
const stop = runtime.state.observe(({ name, newValue, oldValue, object }) => {

})

stop()
```

Or `await` a state change

```javascript
runtime.nextStateChange('someStatefulProperty').then((currentState) => {
  console.log('Finally got a update', currentState)
})
```

or use the events API.  Changes to state properties will emit events
on the runtime.

```javascript
runtime.on(`someKeyDidChangeState`, (newValue, oldValue) => {
  console.log('some key changed', newValue, oldValue)
})

runtime.setState({ someKey: 'fires the event' })

runtime.nextEvent('someKeyDidChangeState').then((newValue, oldValue) => {

})
```

Since the `Runtime` is used as a singleton instance, the state API is very well suited to handling global state that your application might depend on. 

### Helpers: Typed Module Registries 

The [Helper](Helper.md) class is used to define component module types which can be created by the runtime.  Since the runtime creates all instances
of the component helpers, (i.e. you don't call `new Helper()` yourself) every instance can communicate with every other instance through the observable and event APIs on the runtime, and on other helper instances,
and by using the [Helper Context API](./Helper.md)

Every `Helper` class creates a registry for modules that conform to its type specifications.  These registries are also event emitters, which can notify you when 
modules get registered or loaded.  If you've ever used node.js `require`, take a look at `require.cache` which has a bunch of instances of `Module`.  The `Helper` class is
very similar, except you can define custom behavior for modules when you already know about the names and types of objects it exports.

If you've ever used webpacks custom loaders, then think about a `Helper` class as a loader that works at runtime instead of at build time.  Given any
collection of loadable JavaScript objects, the `Helper` class can give you an interface for importing it and working with it in the context of your application.

You can `attach` a `Helper` class to the runtime.

```javascript
class Server extends Helper {

}

runtime.use(Server)

runtime.servers // Server.createRegistry()
runtime.server(options) // new Server(options)
```

All instances of `Server` that get created through the `runtime.server` factory will pass global context down.

You can `attach` a `Helper` to another helper instance.  For example, an `Endpoint` helper can define a registry of
endoints, and an `express` app can implement any one of the available endpoints based on configuration loaded
from the environment or a configuration file.

Each endpoint helper will know about the server, and each server instance will know about the runtime.

The Runtime lets you build a module state tree consisting of Helpers. 

Combined, these two classes make up our Lego like strategy for building applications.



