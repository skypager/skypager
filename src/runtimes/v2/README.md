# Skypager Runtime
> The Helpful JavaScript Framework

The Skypager Runtime library allows you to design a single dependency framework module that works in any JavaScript runtime (web, node.js, electron, react-native, etc.).

The module can best be described as a container, and conceptually has a lot in common with Docker containers.

The container is a per-process singleton. It lets you design Helper classes, which are patterns and adapters which can be loaded by the container.  A Helper is a standard interface for the different types of modules inside your application.  

For example, take the following project structure:

```
- app/
  - models/
    - author.js
    - book.js
  - controllers/
    - authors.js
  - views/
    - book/
      - index.js
      - show.js
    - author/
  - features
```

You can define a Helper for `models`, `controllers`, `views`, and `features`.  And a runtime which is capable of using all of them

```javascript
import runtime, { Helper } from '@skypager/runtime'

class Model extends Helper { }
class View extends Helper { }
class Controller extends Helper { }

export default runtime
  .use(Model)
  .use(View)
  .use(Controller)
```

This runtime module is essentialy a framework, and can power any other projects which have the same folder / file structure and naming conventions.

## Core Classes

### [Runtime](src/Runtime.js)
> [Runtime API Docs](docs/Runtime.md)

The runtime is a global (per process) singleton that acts as a JavaScript application container.  It manages all of the lifecycle of the process, and can be used to coordinate stateful module loading and activation.  For example, if you have an application with trial users and paid users, the ability to load and activate features which only paid users have access to, or only load features which the browser or mobile device supports.

The runtime is designed to be extended by Helper classes, which define module types that your application can implement to be wired up by the runtime and helper lifecycle system.

### [Helper](src/Helper.js)
> [Helper API Docs](docs/Helper.md)

The Helper class defines module types that your project will contain implementations of.  For example, `Feature`, `Client`, `Server`, `Page` are all helpers, and projects which have multiple modules under `src/features` can work with each one using the feature interface (same for servers, clients, pages, etc.)

### [Feature](src/Feature.js)
> [Feature API Docs](docs/Feature.md)

Features are a type of Helper.  They specify a type of module export that can be selectively enabled and configured at runtime either automatically, based on application logic or environment flags (e.g. only if process.env.NODE_ENV === 'test'), lazily (e.g only if they visit the `/search` page), or based on platform support (e.g. is window.SpeechRecognition defined)

### [Registry](src/Registry.js)
> [Registry API Docs](docs/Registry.md)

A registry is an observable, queryable directory of named JavaScript objects, e.g. modules, along with any related metadata about them.   Modules can be registered and requested from a registry.  Registries are used to contain similar (e.g. of the same Helper) module implementations.

Registries power the dynamic, data driven programming techniques , and lazy loading, used by most of Skypager.

## Example Runtime API

The runtime module exports the [Runtime singleton](docs/Runtime.md) as its default export.  The runtime singleton is intended to be a global, root level object (the way window, or document are in the browser.)

```javascript
import runtime from '@skypager/runtime'
```

This is essentially `new Runtime()`.  We rely on the module.cache to ensure this is always the same object. You can call `runtime.observe` to be notified whenever the runtime changes state.  You can call `runtime.setState({ newState: 1 })` to update the state and trigger any observers.  You can `emit` events, you can listen for events.  You can register dependencies for other components in the system to use.

By default, the runtime attaches the [Feature](docs/Feature.md) helper, which is a subclass of [Helper](docs/Helper.md)

```javascript
import runtime, { Feature } from '@skypager/runtime'
runtime.use(Feature)
```

This is how every helper is enabled on the runtime.  You can define your own helpers as needed, whenever you have a standard type of module that you will have multiple implementations of, a Helper can be a good fit.

Attaching a helper, creates two properties on the runtime.

An instance of [Registry](docs/Registry.md)

```javascript
runtime.features
runtime.features.available // => ['vm','profiler','logger']
runtime.feature.register('vm', () => require('./features/vm'))
```

And a factory function which creates instances of [Feature](docs/Feature.md)

```javascript
// anything that has been registered with the registry can be created by name
const vm = runtime.feature('vm')
```