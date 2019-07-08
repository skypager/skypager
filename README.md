# Skypager
> Universal, Fully Integrated, Cross Platform JavaScript Container that you can talk to.

[![CircleCI](https://circleci.com/gh/skypager/skypager/tree/master.svg?style=svg)](https://circleci.com/gh/skypager/skypager/master) [![Windows Build status](https://ci.appveyor.com/api/projects/status/j83kh674nbsl3us1/branch/master?svg=true)](https://ci.appveyor.com/project/soederpop/skypager/branch/master)

![Logo](docs/skypager-logo-nobg.svg)

Skypager is a framework agnostic library and toolchain for creating, building, publishing, deploying, and running JavaScript projects **that you can talk to**.

By talk to, [I don't just mean literally](https://voice.skypager.io), but more importantly conceptually.  It provides you with concepts and modules that follow natural language patterns,
which allow your code to take on a conversational style that happens to fit very well with the way JavaScript runs in all environments.  

As an author of code, you only want to have to say the minimum, and still achieve the desired effect.  This is much harder to do than it sounds, and so this library is an attempt to make that easier.

## Skypager's Structure

This project is a monorepo which publishes many different packages, some are useful only when authoring JavaScript programs, some which only run in node.  

The [Core Framework](src/runtime) has a [Node Variant](src/runtimes/node) as well as a [Web Variant](src/runtimes/web), which load [Specific Features](src/features) that might only be relevant to that particular platform (e.g. [node](src/runtimes/node/src/features) or [web only](src/runtimes/web/src/features)) 

It also has [specific helper classes](src/helpers) that may work differently depending on the platform, but are designed to let your code say the same thing anyway. 

The goal is to enable you, as a an author of many JavaScript projects, to just simply talk to your code and tell it what you want, and let the runtime figure out what to do with that information.

## Build-time and Runtime modules 

Modules like [@skypager/cli](src/devtools/cli) provide you with commands that can be used in the build / run / publish / deploy phases of your JavaScript projects.

[@skypager/cli](src/devtools/cli) is a script runner that will 

- run scripts found in your current project's `scripts` folder first 
- if your project is a monorepo, it will search your own @scope for `scripts/`
- run any built in scripts from any of the `@skypager/*` modules you have installed that "provide" those scripts.  

When your code is running, Skypager provides a global runtime singleton (like `document` or `window` in the browser) that has different APIs which can be used to build all of 
the components that are needed to power a modern JavaScript application, whose state and logic might be spread across the browser and node APIs.  

In node requiring `skypager` will always return the same object, with the same state.  It will be rooted in the current project, the nearest package.json in your current working directory.  It will also be tied to the current git repository.

Similarly, in the browser, the skypager global is a singleton that is tied to the current URL (the hostname and pathname components of the URL at least.)  

These instances of the runtime are designed to work together.  (Consider that there's often a one to one relationship between some package.json in your portfolio, and some URL or domain that you own.)  

The build environment and run environment can be connected in many different ways, all of which make all different phases of the application development cycle more productive.

## Installation

You can install the single package [skypager](src/main) which provides you with the latest versions of the [@skypager/cli](src/devtools/cli) [@skypager/runtime](src/runtime) [@skypager/node](src/runtimes/node) and [@skypager/web](src/runtimes/web) modules.  

This package has been around the longest, and is version `40.x.x`. 

It is a single package to install that depends on the scoped `@skypager/*` modules which are version `1.x.x`, and released from the master branch of this repository. 

```shell
$ yarn add skypager --save 
```

Or if you prefer you can install the individual packages you need.

```shell
# for single page apps and node servers or scripts
$ yarn add @skypager/cli @skypager/node --dev 
# for the browser builds, this is a runtime / production dependency
$ yarn add @skypager/web --save 
```

**Optional**

If you wish to take advantage of webpack `build` `start` and `watch` scripts, modeled after [Create React App](https://github.com/facebook/create-react-app), you can install `@skypager/webpack`

```shell
$ yarn add @skypager/webpack --dev
```

If you wish to use MDX, and the [Skypager Document Helper](src/helpers/document) to be able to build cool things using your project's Markdown and JavaScript modules as a database, such as generate
runnable, editable websites from your README.md 

```shell
$ yarn add @skypager/helpers-document --save
```

If you wish to use various [Google Services](src/features/google), which let you treat [Google Spreadsheets as a Database](src/helpers/sheet) or [Google Docs as a CMS](src/helpers/google-doc) 

```shell
$ yarn add @skypager/google @skypager/helpers-sheet @skypager/helpers-google-doc --save
```

## CLI

Installing [@skypager/cli](src/devtools/cli) will provide an executable `skypager`.

Typing `skypager help` will show you all of the commands available, these commands are simple node.js scripts that live in a `scripts/` folder in various packages.

It searches:

- scripts found in your current project's `scripts` folder
- if your project is a monorepo, it will search your node_modules paths for projects in your @scope, to see if they "provide" any `scripts/`
- it will search your node_modules paths for any `@skypager/*` modules that ["provide" those scripts](src/helpers/server/package.json).  

You might want to write your project scripts with es6 style imports, or with language features that require transpilation before running natively.

So the `skypager` executable will look for the following flags, or environment variables, to enable transpilation of your es6 code so it runs in node.

When you run `skypager`

- with the `--babel` CLI flag, we enable `@babel/register`
- with the `SKYPAGER_BABEL=true` environment variable set, we do the same
- with the `--esm` CLI flag we enable the [esm module](https://github.com/standard-things/esm) 
- with the `SKYPAGER_ESM=true` environment variable set, we do the same. 

Which you use is up to you. `esm` is great if you don't want non-standard language features but still want es6 import / export 

See [The CLI Docs for more information][docs/how-the-skypager-cli-works.md]

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

## Designed to be Extendable

The `runtime`, while useful by itelf, is designed to be extended.  

We can extend the runtime with different [Helper Classes](docs/about-helpers.md).  Helpers are classes which represent any kind of source code document that you can eventually require as a JavaScript module (which if you use webpack, is literally everything.) 

Examples of helpers that are currently provided by skypager include [servers](src/helpers/server), [clients](src/clients), [features](src/features), [spreadsheets](src/helpers/sheet), [markdown documents](src/helpers/document). 

In the example below, we start with the core JS runtime and add some features.

```javascript
import runtime from '@skypager/runtime'
import MyNotificationsFeature from '@my/features-notifications'
import MyLoggingFeature from '@my/features-logging'
import MyAnalyticsFeature from '@my/features-analytics'
import MyUserAuthenticationFeature from '@my/features-authentication'

const myRuntime = runtime
  .use(MyUserAuthenticationFeature)
  .use(MyNotificationsFeature)
  .use(MyLoggingFeature)
  .use(MyAnalyticsFeature)

export default myRuntime 
```

With this module, you have encoded a standard base layer that all of your apps can share.  

These apps should never need to solve authentication, notifications, logging, or analytics on their own.  They get the benefit of these features just by using your runtime.

Just tell the runtime what it needs to configure your authentication feature for the current environment 

```js
runtime.feature('authentication').enable({
  provider: 'firebase',
  options: { ... }
})
```

and then any application can do what it usually does

```javascript
import runtime from 'my-example-runtime'
const auth = runtime.feature('authentication')

const loginButton = document.getElementById('login-button')

loginButton.addEventListener('click', () => auth.login({ username, password }))
```

you can see how the application code can easily use aws or google or your own custom auth, and it never needs to change.

### Extensions API 

Extending the runtime with another module, relies on the following API

Your extension module can:

- **export an attach function** to run synchronously

```javascript
export function attach(runtime) {
  // runtime is the instance of the runtime that is using the extension
}
```

this style allows for extensions to take effect right away.

- **export a function** to run asynchronously, which you can delay until you're ready to call `runtime.start()`

```javascript
export default function initializer(next) {
  const runtime = this
  Promise.resolve().then(() => next())  
}
```

For example

```javascript
import skypager from '@skypager/runtime'

skypager
  .use({
    // runtime is generic, could be any instance of the runtime if you have multiple.
    // in most cases skypager.uuid === runtime.uuid
    attach(runtime) {
      runtime.log(`Extending runtime ${runtime.uuid} with a synchronous extension`)
    }
  })
  .use(function (next) {
    // extensions should always operate on the current runtime, since you can create multiple instances in certain scenarios
    const runtime = this
    runtime.log(`Extending the runtime ${runtime.uuid} with an asynchronous extension`)
    
    Promise.resolve().then(() => {
      runtime.log(`Connected, finishing.`)
      next()
    })
  })
```

This extension API gives you full control, in your application, or in reusable components, for when code and dependencies can be loaded and how they are to be configured.  

### Lazy Loading Example

For example, with the extension API it is possible to package up modules which lazy load other modules on demand. 

```javascript
import runtime from '@skypager/web'

function loadAtRuntime(next) {
  const runtime = this

  // runtime.currentState will equal whatever window.__INITIAL_STATE__ is set to.  This can be injected by
  // whatever is outputing your HTML.  (Webpack / Express, etc.)
  const settings = runtime.currentState.settings

  // loads the requested feature from unpkg, assumes the global variable name each module exports follows the library package name convention
  const feature = (name, options = {}) => {
    const { version = 'latest' } = options
    const { upperFirst, camelCase } = runtime.stringUtils
    const globalVar = upperFirst(camelCase(name.replace('@', '').replace('/', '-'))) 

    return runtime.assetLoaders
      .unpkg({ [globalVar]: `${name}@${version}` })
        .then(results => {
          const extension = results[globalVar]
          runtime.use(extension)
        })
  }

  return Promise.all([
    feature('@skypager/integrations-firebase', {
      config: settings.firebase 
    }),
    feature('@skypager/integrations-npm', {
      config: {
        npmToken: settings.npmToken
      }
    }),
    feature('@skypager/integrations-github', {
      config: {
        token: settings.githubToken
      }
    })
  ])
}

export default runtime.use(loadAtRuntime)
```

In the above example, I've packaged up a runtime that comes complete with a firebase integration, a github and npm integration.

All of the code needed to power these integrations is lazy loaded when needed from unpkg.  You could substitute your own CDN, or use webpack's 
dynamic imports to lazy load, whatever works for your situation. 

This reusable module expects that it will be dynamically configured at runtime via `settings` that is pulled from the runtime's state.

This is generally a good practice, if you're familiar with [12 Factor Apps](https://12factor.net). You generally don't bundle these "secrets" with your source code, or you have different settings in development, staging, and production. 

The runtime's extensions API makes it easy to combine the cached source code you load from disk, with the runtime specific configuration for that app.

The runtime's state is data that can easily be controlled to be project specific, deployment specific, or dynamically controlled based.

It can be based on any combination of

- node's `process.env` or `process.argv` variables. 
- the current directory
- the current package.json or git repo
- the current URL or hostname 

The extension API and runtime make all of this environment and process specific data available as the runtime loads and enables the features it needs to run your program.

## Beyond Boilerplates 

The idea of using boilerplate projects, or even most recently, Github template repositories, is appealing because github repositories are free and unlimited and disk space is cheap.  Duplicating npm dependencies, and boilerplate code for wiring up React with
React Router, and with express and server side redering, is a manageable side effect as you begin to accumulate projects and repositories.

With Skypager, you are encouraged to developing using a monorepo, or portfolio. The boilerplate in your application can be managed by conventions for project types and module exports that are specified at a portfolio level and shared across all of the projects.

So it is possible to abstract things which provide build scripts and say

- all of my modules which provide build scripts are named `@myscope/build-scripts-*`
- all of my modules which provide servers are named `@myscope/servers-*` 

In a monorepo, there can be multiple providers of `build-scripts` and `servers`,  but your project code never needs to know or say more than `skypager build` or `skypager serve`. 

Skypager makes this just in time module composition a first class citizen in your projects.

That being said, boilerplates are still good and have their place.

- [Full Stack Skypager Application](https://github.com/soederpop/skypager-fullstack-boilerplate)
- [Full Stack Skypager Application with Google Helpers](https://github.com/soederpop/skypager-google-project-boilerplate)

## What does the runtime provide your application?

- See the [API DOCS](src/runtime/docs/api)
- Asynchronous middlewares and lifecycle hooks (tap into any stage of the application boot and initialization logic)
- Environment detection (isBrowser, isNode, isReactNative, isElectron, isElectronRenderer, isProduction, isDevelopment, isTest, isCI, etc)
- Event emitters and global event bus patterns
- [A 12 factor application architecture pattern](docs/12-factor-architecture.md) that makes it easy to containerize your frontend code and inject environment or deployment specific configuration in from the outside, so that your applications are portable and vendor agnostic.
- A really good balance between composition and inheritance.  Inspired by React and Docker.
- Out of the box integration between design / build / test / runtime contexts ( even in production! ) 
- Utilities for working with strings, urls, routes
- [A module registry system](docs/module-registries.md) that can load any kind of module in any environment (even dynamically at runtime in the browser from npm) 
- [Utilities for dynamically building interfaces and mixins](docs/property-utils.md) (turn any simple JSON object you have access to into an [Entity](docs/entity-model.md) 
- Dependency injection API

### Familiar Component Module (State, Props, Context) 

Componetize any Runtime, and Componetize any module in the Runtime with a `Helper` class that is very similar conceptually to a React Component.  Each Helper subclass can be used to `mount` any module and provide it with observable state and life-cycle hooks.

- The `Helper` is a `React.Component`, the instances are the mounted elements.  
- The module (a helper's `provider`) provides `defaultProps` 
- The options you pass when you create a `Helper` instance are the actual props
- The Rutime can pass context down to Helper instances which can pass their own context down to other Helpers they create. 
- Each module instance has a observable `state`

### Observable / State API

The Runtime uses the Mobx library as its reactive state engine to provide applications with observable objects.  It uses it internally, and exposes it as a dependency that can be injected into your app if you don't want to bundle Mobx separately.

The Runtime has a `state` observable, and a React like `setState` API

Helper subclasses can provide their own observable state as well, and really any mobx primitive

## Helper Classes

[Helper Classes](docs/about-helpers.md) are used to define types of modules, or modules which should export predictably named values that adhere to some schema that the helper class expects.  

For example the `Server` helper is something your program can call `start` and `stop` on.  The underlying provider module is in control of whatever that means.

The `Feature` helper is something your program can call `enable()` on, and then use to do whatever it is the underlying provider module allows.

- [The Rest Client Helper](src/helpers/client) - a wrapper around the axios REST client.  As a developer you can write a friendly, cross-platform interface for making calls with axios.
- [The Server Helper](src/helpers/server) - a wrapper around any server that can be started and stopped.  By default provides an express server with history api fallback and static file serving enabled.
- [The Feature Helper](src/runtime/helpers/feature.js) - a module that provides an interface to specific functionality on the running platform. Can be `enable()d` or `disable()d`
- [The Google Sheets Helper](src/helpers/google-sheet) - a module that loads data as JSON from a google spreadsheet.  As a developer you can write an interface for reading, transforming, or updating this data.
- [The Google Documents Helper](src/helpers/google-doc) - a module that loads data as JSON from a google document.  It loads all of your content, and document stylesheets, in an traversable AST form.
- [The Sketch Document Helper](src/helpers/sketch) - a module that lets you load a designers sketch files as javascript modules.  This can be used to power various code generation apps, as well as anything else you can think of.
- [The Document Helper](src/helpers/document) - provides helpers for loading markdown and javascript source modules as queryable entities, useful for automated codemods, code generation, documentation websites, and building databases from markdown or javascript module collections

## Example Projects

Skypager is a powerful framework which can be used to build any kind of app, here are some examples.

- [Sheets Server](src/examples/sheets-server) A REST API that lets you browse your google spreadsheets, and request them in JSON form
- [Voice Commander App](src/examples/voice) literally you can just talk to skypager, this project uses mdx to present a a tutorial for building your own skypager feature for working with voice synthesis / speech recognition engines.
- [Runnable / Renderable Code Blocks](src/examples/runnable-mdx) an example of using the document helper to build live editable React documentation.
- [Portfolio Browser](src/apps/portfolio-browser) visually explore the skypager monorepo dependencies, or node_module dependency graphs with different cytoscape.js layouts. 
- [Full Stack Skypager Application](https://github.com/soederpop/skypager-fullstack-boilerplate)
- [Full Stack Skypager Application with Google Helpers](https://github.com/soederpop/skypager-google-project-boilerplate)
- [Conceptual Example](docs/conceptual-example.md) describes a conceptual project you can build using the concepts / tools provided by the skypager framework.

## Local Development

In order to develop and test this project locally, you will need a service account json for a google cloud project.  It should have the google drive and sheets api's enabled.

In order to run the tests, This file's content needs to either be stored in an environment variable `SERVICE_ACCOUNT_DATA` or you will need to copy this file to

- src/helpers/google-sheet/secrets/serviceAccount.json
- src/examples/sheets-server/secrets/serviceAccount.json

See our [Circle CI Config](.circleci/config.yml) for an example of how I set up a project in CI to run tests.
