# Skypager Runtime
> The Helpful JavaScript Framework

The Skypager Runtime library allows you to design a single dependency framework module that works in any JavaScript runtime (web, node.js, electron, react-native, etc.).  This module can be shared across many different projects.

Skypager provides you with a library, and an opinionated architecture for your JavaScript portfolio.  Using it means you will develop a shared "runtime" that consists of all of the features and capabilities you have in your portfolio(s), which can be enabled as needed on a project by project basis.  Any time you solve a problem in one project, it should be reusable by any other projects you develop in the future, or added to a project you've already developed or are working on currently.    

## Main Advantages

The main advantages, which I will dive deeper into below, can be summarized:

- [Simpler Project Code](#simpler-project-code)
- [Feature APIs](#feature-apis)
- [Reusability across projects](#reusability-across-projects)
- [Reusability across platforms](#reusability-across-platforms)
- [Testability](#testability)
- [Cacheability](#cacheability)
- [Versionability](#versionability)

### Simpler project code

If you're building a lot of projects, and every project is its own git repo and has its own developer dependencies and things of that nature, that is a lot of weight per project.  By developing a shared runtime module to share between projects, projects which have the same type of source code and same common dependencies (e.g. React, React DOM, React Router, Bootstrap`), can be freed from having to worry about any of this and instead rely on a single dependency module and its APIs to build the unique user experience and value that defines the current project.

Skypager runtime allows your projects to tell you what makes them unique, and hides away the components that make them similar, so you can focus on user value in your code. 

### Feature APIs
> Features provide common APIs that are provider agnostic (e.g. aws vs google cloud, braintree vs stripe)

Along the lines of simpler project code, imagine the following React component

```javascript
function LoginForm({ auth }) {
  const { isLoggedIn, currentUser, login, logout } = auth
  
  if (isLoggedIn) {
    return <div>Logged in as ${currentUser.name}. <button onClick={logout}>Logout</button></div>
  }

  return (
    <form>
      <label for="login">Login</label>
      <input id="login" type="text" name="login" />
      <label for="password">Password</label>
      <input id="password" type="password" name="password" />
      <button onClick={login} >Login</button>
    </form>
  )
}
```

A login function that takes a username and password, and logs the user in.  A logout function that logs the user out, and info about the current user if they're logged in.  This is the essence of any authentication feature.  Anyone who has developed their own from scratch knows there is a ton more that goes into it, behind the scenes - setting up users, credentials, all the security, etc.  

The [Feature](docs/Feature.md) class provides you with a way of building features which focus on the essence of what your applications need, and assume 
you will provide it with some bindings to the underlying implementation which makes everything work.

Your applications code benefits from this abstraction to contain only the essential code that describes the behavior.  The implementation details are neatly tucked away in separate, testable, versionable, cacheable modules. 

### Reusability across projects

The Runtime concept has a lot in common with [Inversion Of Control](https://en.wikipedia.org/wiki/Inversion_of_control) and [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection).  You could say it uses forms of both.

Runtimes, the Helpers it has, and the implementations of those helpers generally define a clean module boundary between the code that is specific to your app, and the code which is more general to any app.

This means that you can develop the code on each side of this boundary independently.  One team (or you, on a specific day) can focus on the shared framework, and another on the specific project, and never touch the same files.

This leads to a situation where features and enhancements you make to the project are easier to copy between projects, because they have less hard dependencies to the rest of the project.  

### Reusability across platforms

When your application / project code does not talk directly to the underlying platform (e.g. to the browser, or to node) but instead talks to an instance of a runtime, this gives you the flexibility to use an API in your application, and implement it differently depending on the current platform.

Imagine you had a React component which was a file editor.  You want this component to work in electron, where it has access to native filesystem APIs, and in the browser, where you rely on a remote file storage system like amazon s3. 

Would you rather have a separate React component for the browser and electron? Or should you have one component that has a file system adapter that does the right thing either way?

By developing your application's logic on top of the runtime concept, you make it easier to reuse code by having an abstraction responsible for cross-platform negotiation behind the scenes instead of in the code you work on actively. 

### Versionability

Boundaries naturally exist between different modules in a project:

- Underlying 3rd party frameworks
- the Runtime, common Helpers and their implementations
- Application Code which uses the runtime and its helpers
- UI Code and Themes

The Runtime architecture makes it easy to structure your code so that there is minimal overlap and each module can be changed and versioned independently.

This makes it easier as an application grows to isolate bugs, provide backward compatibility, to do A/B testing, and a lot of other things.  

### Testability

With all of the advantages described above, it is hopefully clear that having modules which are easily isolated from one another and from the rest of the dependencies in your project, leads to a general improvement in testability of your code.

There are specific aspects of the Runtime itself, and especially in the [Helper APIs](docs/guides/flexible-helpers.md) that make things even easier to test.

### Cacheability 

To achieve the best user performance, you probably need multi layers of caching.  Every module you import is a cache point.  

You want to be able to cache modules for as long as possible.  

You want to avoid changes in a single component from requiring you to download all of React again, so you'll want to separate them.

Doing this well also effects build performance if you're using tools like Webpack.  Skypager's design helps you follow best practices for this. 

See [This Guide](docs/guides/cacheable-helpers.md) for more info.

## What is a runtime?

The runtime module can best be described as a container, and conceptually has a lot in common with Docker containers.

The container is a per-process singleton. 

It uses Helper classes, which are similar to a React Component, but can be headless (i.e. no render).  A Helper class defines patterns and adapters which can be loaded by the container.  

A Helper is a standard interface for the different types of modules inside your portfolio of applications.

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

This looks like a Ruby on Rails app.  And like a Ruby on rails app, it encourages you to take advantage of naming conventions.  

The Helper class will align with the naming conventions of most project's source code (pluralized folder names)

You can define a Helper for `models`, `controllers`, `views`, and `features`.  And a runtime which is capable of using all of them

```javascript
import runtime, { Helper } from '@skypager/runtime'

export default runtime
  .use(Model, { folder: runtime.resolve('app', 'models') })
  .use(View, { folder: runtime.resolve('app', 'views') })
  .use(Controllers, { folder: runtime.resolve('app', 'controllers') })

// framework/helpers/Model.js
export class Model extends Helper { 
  get tableName() {
    const { pluralize } = this.stringUtils
    return pluralize(this constructor.name).toLowerCase()
  }  

  async find() {}
  async findOne() {}
  async update() {}
  async delete() {}
  async create() {}

  // attach the model helper class, then discover all instances of model type modules in the project
  static attach(runtime, options) {
    Helper.attach.call(this, runtime, options)
    
    runtime.fsx.readdirSync(options.folder).forEach((modelFile) => {
      runtime.models.register(modelFile, () => require(modelFile))
    })
  }
}

// framework/helpers/View.js
export class View extends Helper { 
  get model() {
    return this.runtime.models.forView(this)
  }
}

// framework/helpers/Controller.js
export class Controller extends Helper { 
  get model() {
    return this.runtime.models.forController(this)
  }
}

// app/models/book.js
export class Book extends Model {

}

// app/controllers/books.js
export class BooksController extends Controller {

}
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

## Runtime API Walkthrough 

The runtime module exports the [Runtime singleton](docs/Runtime.md) as its default export.  The runtime singleton is intended to be a global, root level object (the way window, or document are in the browser.)

```javascript
import runtime from '@skypager/runtime'
```

This is essentially `new Runtime()`.  We rely on the native require.cache to ensure this is always the same object in node, or the window global in the browser. You can call `runtime.observe` to be notified whenever the runtime changes state.  You can call `runtime.setState({ newState: 1 })` to update the state and trigger any observers.  You can `emit` events, you can listen for events.  You can register dependencies for other components in the system to use.

By default, the runtime attaches the [Feature](docs/Feature.md) helper, which is a subclass of [Helper](docs/Helper.md)

```javascript
import runtime, { Feature } from '@skypager/runtime'
runtime.use(Feature)
```

This is how every helper is enabled on the runtime.  You can define your own helpers as needed, whenever you have a standard type of module that you will have multiple implementations of, a Helper can be a good fit.

Attaching a helper, creates two properties on the runtime.

By default, there is a `runtime.features` that is an an instance of [Registry](docs/Registry.md)

```javascript
runtime.features
runtime.features.available // => ['vm','profiler','logger']
runtime.feature.register('vm', () => require('./features/vm'))
```

And a factory function `runtime.feature` which creates instances of [Feature](docs/Feature.md)

```javascript
// anything that has been registered with the registry can be created by name
const vm = runtime.feature('vm')
```

## Example Helper

Now that we've seen how a standard helper works, Let's look at an example `Server` helper.

First, we define the class by extending Helper.

```javascript
import { types, Runtime, Helper } from '@skypager/runtime'
import express from 'express'

export class Server extends Helper { 
  static optionTypes = {
    port: types.number
  }

  static defaultOptions = {
    port: 3000
  }

  initialState = {
    listening: false
  }

  start() {
    const { port } = this.options
    this.setup()

    return new Promise((resolve, reject) => {
      this.app.listen(port, (err) => {
        err ? reject(err) : resolve()
      })
    }).then(() => {
      this.emit('started')
      this.setState({ listening: true })
    })
  }

  setup(options = {}) {
    this.app = express()    
    const { setup } = provider

    setup.call(this.app, options)
  }
} 
```

Then we extend an instance of the runtime with that Helper

```javascript
export const runtime = new Runtime()

export default runtime.use(Server)
```

This allows us to register any server providers with the servers registry.

```javascript
// runtime.servers is an instance of Registry
// app is the name of a server module 
// the module being registered provides the Server defined providerTypes
runtime.servers.register('app', () => ({
  setup(app) {
    app.get('/', (req, res) => res.json({ hello: "world" }))
  }
}))
```

And then create that server by name, pass it options, and start it 

```javascript
// runtime.server is a factory function which creates instances of Server accepting Server defined optionTypes
runtime.server('app', { port: 3001 }).start()
```