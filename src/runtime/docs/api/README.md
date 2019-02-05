# @skypager/runtime API Docs
> yarn add @skypager/runtime --save

## Runtime

[API Docs](runtime.md)

You can subclass `Runtime` using the following

```javascript
import runtime from '@skypager/runtime'

const { Runtime } = runtime

class MyRuntime extends Runtime {

}
```

Or you can just use the global singleton instance of `Runtime`  that you get when you import a runtime module, and build upon that with different layers depending on which platform and environment your code is running in.

```javascript
import runtime from '@skypager/runtime'
import sameObjectAsRuntimeButWithWebFeatures from '@skypager/web'
import sameObjectAsAboveButWithNodeFeatures from '@skypager/node' 
```

The global singleton instance of `Runtime` can be gradually built up in layers

a layer is a collection of the [Helper](helpers/helper.md) and [Feature](helpers/feature.md) classes

## Helper

[API Docs](helpers/helper.md)

Subclasses of `Helper` define roles, or patterns, for other modules in a project to conform to, so that your application can later use those modules in a specific way

For example [@skypager/helpers-server](../../helpers/server/docs/api) defines a `Server` class which extends `Helper`.  

This lets us package multiple different `servers` and start any one of them in the context of our current runtime.  

To be usable, these packaged servers need to provide implementations of functions specified by the `Server` helper.

The [Feature](helpers/feature.md) helper, which is documented below, lets us package any kind of functional interface as something that can be conditionally `enabled()` and configured with environment, process, URL or user specific settings.  

## Feature

[API Docs](helpers/feature.md)

The `Feature` class subclasses `Helper` and is attach by default to any `@skypager/runtime`.

By default, the [VM Feature](features/vm.md) and [Profiler Feature](features/profiler.md) are enabled.

