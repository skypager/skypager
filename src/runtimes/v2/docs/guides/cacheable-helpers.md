# Cacheable Helpers

JavaScript works well when cached to the max.  When every layer of caching is taken advantage of.  

For consumers of JavaScript: CDNs, local browser caches, in memory caches, application caches, whatever.  

For builders of JavaScript: Bundlers and Dependency Registries

To use a cache, you need the concept of a key that represents a unique object.  One key, one object.  If something exists at that key, use it. If not, you miss, and you do something expensive, then you have the value you need.  

Anyone that comes after you will have a cache hit.

Optimizing a JavaScript application for caching is a great way to achieve great runtime performance.  These optimizations can easily be undone by common coding practices and over time, will represent a recurring battle.

And of course, building a large JavaScript application from many modules can take time, so we want to leverage caching here as well.

To cache well, you need to separate the things which change, so the things which change often don't invalidate caches of things which change infrequently.

Skypager's Runtime and Helper APIs are designed to help you take advantage of the many layers of caching (and validation / invalidation) that exist in JavaScript, especially with multiple modules.

## Helper Cache Components

Helpers are classes, whose instances are created by combining 

- a `provider`, which is typically a module, that has a known version number, hash, or URL, and is registered by name in the Helper registry.
- `options` which is whatever object is passed to the helper when it is created.  Helpers can return the same instance for the same unique options objects.

```javascript
const devClient = runtime.client('api', { env: 'dev' }) // uuid = 1
const altDevClient = runtime.client('api', { env: 'dev' }) // uuid = 1
const prodClient = runtime.client('api', { env: 'prod' }) // uuid = 2
```

- `context` which is information passed down by the parent `runtime` which created the instance of the helper.

Each of these objects can be [type validated at runtime.](../Helper.md)

Each of these objects are also independently cacheable (e.g. their source can live in three separate files / modules)