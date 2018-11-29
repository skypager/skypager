# Runtimes

The [Skypager Runtime](../runtime) lends itself really well to being extended.  Since it is a universal, singleton,
any other library which wants to provide a runtime can import it, and add their own additional features, or helpers, and export
the runtime with those new capabilities.

## Node Runtime

The [@skypager/node](node) package is the version of the runtime we get when we run packages with the [Skypager CLI](../devtools/cli) 

It comes with: 

- the [File Manager Feature](../features/file-manager) 
- the [Package Manager Feature](../features/file-manager/src/features/package-manager.js)
- the [Server Helper](../helpers/server)

And a bunch of other features for working inside the Node.js runtime. [See them all](node/src/features)

## Web Runtime

The [@skypager/web](web) package is the version of the runtime we get when running in the browser.

It comes with:

- The [Client Helper](../helpers/client)
- The [Asset Loader Feature](web/src/features/asset-loader.js)
- The [Babel Standalone Feature](web/src/features/babel.js)

## Example Runtime Extension

```javascript
import runtime from '@skypager/runtime'
import * as MyHelper from 'my-helper'
import * as MyFeature from 'my-feature'

export default runtime.use(MyHelper).use(MyFeature)
```

The `runtime.use` API accepts the following parameters:

- **A module which exports an `attach` function** will be run synchronously, immediately. The `attach` function will be passed the runtime instance.

```javascript
runtime.use({ attach() {
  runtime.feature('my-feature').enable()  
}})
```

- **A function which is passed a next callback to call when finished** will be run when `runtime.start()` is called.

```javascript
runtime.use(function myExtension(next) {
  doSomethingAsync().then(() => next()).catch(error => next(error))
})
```
