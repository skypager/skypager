# Helpers Overview via a Socratic Dialogue

[Click here](https://github.com/skypager/skypager/tree/master/src/helpers) to see all of the generic helpers.

A helper is a class which wraps a certain type of module. It’s the idea that you have an abstract model that represents a module file in your project. In other words, a helper defines an interface for a module's `module.exports` to conform to.

Most often which type of helper we use to wrap a module corresponds to the subfolder the module lives in under src.

e.g. all `src/features/` will be wrapped with the Feature helper. The Feature helper is designed to load all of the mdoules found in `src/features` and create a registry of these modules.

All `src/servers/` will be wrapped with the Server helper. `class Server extends Helper { ... }`

When I say `runtime.feature('os-adapter')` that is the equivalent of

`new Feature({ provider: require('skypager-runtimes-node/features/os-adapter') })`

or

`runtime.feature('os-adapter', { myOption: 1 })`

or

`new Feature({ myOption: 1, provider: require('skypager-runtimes-node/features/os-adapter') })`

Actually, to be more precise, there’s a second argument - `new Feature(options, context)` where context is runtime.context.

This is how we mimic the React API; helpers are like child components in a React tree.

Runtime is the root and helpers can contain other helpers. Helpers abstract the common interface every `Server` should have e.g. start, stop, configure.

A feature helper abstracts the common interface every `Feature` should have, e.g. enable, isSupported, disable.

You can define your own types of helpers — think of these like framework elements. Every React app is a collection of modules, but we have special types of modules, e.g. pages, layouts, components. We could wrap every page we have in a Helper, and we’d have the idea of a “page object model”.

`runtime.pageModels.available => ['LoginPage', 'AccountActivationPage', 'HomePage', 'QuoteDetailsPage']`  
`runtime.page('LoginPage').url // => /login`  
`runtime.page('LoginPage').navigate().screenshot()`

So, imagine our `src/pages/QuoteDetailPage` has a lot of specific dependencies. Skypager can still be aware of the page’s existence, along with metadata about it,
before loading the actual code.

From the command line we can work with all the servers we have. For example, if we had a server called "history."

`sky start history`  
`sky start development`

This would just dispatch a call to `runtime.server('history', runtime.argv).start()`.
The provider module of the history server can be anything, it just needs to implement `start`, `stop`. Make sense? Think of the helpers aspect as building blocks that you can use to build a framework. You could have a helper called `SpecFile` — and only enable it on the runtime if `runtime.isTest` aka `process.env.NODE_ENV === test`

**This is a lot to take in - but I think I understand the concept overall. Helpers are like the methods and functionality of a framework. They're the opinions, so to say, of opinionated frameworks, right?**

Yep – helpers are generic, pattern style interfaces that help you load a large tree of named JavaScript modules and apply certain patterns/behaviors to these JavaScript modules.

This way you can have a folder like `src/features` and it only needs to contain a bunch of files which export simple functions. Skypager/runtime/the framework decorates these simple modules, makes them stateful and caches them so that every call to `runtime.server('history')` refers to the same thing.

Also, every Helper has common lifecycle hooks, the way a React Component has `componentDidMount()` `componentDidUpdate()` etc.

**So, do we have a devtools package in portfolio because attaching them to Skypager would make it too large? We want to keep Skypager/runtime down to functionality that is cross-platform?**

Yep — there is something called `skypager-runtimes-development`. It’s basically the same as our devtools package. In a lot of ways, it’s better, but it is stuck on webpack 2. Since webpack 2, webpack 3 and 4 have adopted patterns to make it much easier to config - like the idea of config presets.

So right now, we just use `skypager-runtimes-node` and have all our webpack stuff externalized.
The `skypager-runtimes-development` package has a ton of additional helpers, like one called Webpack — but I plan to rewrite this so don’t worry about it too much. All our old projects, `frontend-javaScript-sdk`, marketplace, etc., all use `skypager-runtimes-development` instead of `@dais/devtools`.