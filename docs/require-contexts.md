# Require Contexts

If you bundle your code with webpack, there is a webpack only feature called `require.context`

This can be used to require a whole folder of JavaScript code.  Say you have the following tree

```
src/components
├── ActiveDocument.js
├── CameraControls.js
├── DocLink.js
├── DocRepl.js
├── DocsMenu.js
├── NavLayout.js
├── Scene.js
├── ScrollableHeader.js
└── SourceViewer.js
```

`require.context` can be used to load all of these components 

```javascript
const components = require.context('./src/components', true, /\.js$/)

components.keys() // => ['ActiveDocument.js', 'CameraControls.js']

components('ActiveDocument.js') // same as require('./src/components/ActiveDocument.js')
```

## Polyfilling require.context in node

If you use the [babel-plugin-require-context-hook] babel plugin to transpile your code, you can use require context in node, by requiring the following module in your entry point 

```javascript
require('babel-plugin-require-context-hook/register')()
```

This module will automatically be required for you when you use the [@skypager/cli](./how-the-cli-works.md)

## Skypager Context Registries

The [Skypager Context Registry](../src/runtime/src/registries) is like a queryable database for modules, that you can add a `require.context` to.

Given the following tree:

```
src/features
├── authentication.js
├── docs.js
├── notifications.js
└── scene-manager.js
```

```javascript
const runtime = require('@skypager/node')
const features = require.context('./src/features', true, /\.js$/)
runtime.features.add(features)

runtime.features.available // => ['authentication', 'docs', 'notifications', 'scene-manager']
```

Any of the [Helper Classes](about-helpers.md) in Skypager will attach a registry for those types of helpers 

```javascript
runtime.clients
runtime.features
runtime.selectors
runtime.servers
```

so when you have a project source tree like 

```
.
├── clients
│   └── npm
│   └── github 
├── features 
│   └── authentication 
│     └── aws 
│     └── firebase 
│   └── payment-processors 
│     └── braintree 
│     └── stripe 
├── selectors
│   └── npm 
│     └── packages 
│     └── maintainers 
│   └── github 
│     └── repositories 
├── servers
│   └── standard 
``` 

You can easily register the subfolder with the corresponding helper registry

```javascript
runtime.clients.add(require.context('./src/clients'), true, /index.js$/)
runtime.features.add(require.context('./src/features'), true, /index.js$/)
runtime.servers.add(require.context('./src/servers'), true, /index.js$/)
```

The context registry at `runtime.features` would tell you that you have `authentication/aws` and `authentication/firebase` available, 
and will load them on demand if requested by the application.

```javascript
const authProvider = process.env.AUTH_PROVIDER || 'firebase' 
const auth = runtime.feature(`authentication/${ authProvider }`)

auth.enable({ ... })
```

similarly, the servers registry would have `standard` available.  The `runtime.clients` registry would have `npm` and `github` available.

This technique re-introduces dynamic require capabilities, while still working with webpack's requirement that you do not have expressions in your require statements.