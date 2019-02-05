<a name="unpkg"></a>

## unpkg(dependencies, options)
Load assets from unpkg.com by name, will asynchronously load them
by injecting a script tag.  The Promise will resolve when the asset
has been loaded.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| dependencies | <code>object</code> | an object whose keys are the global variable name of the package,                                and the value is the path to the umd build on unpkg.com |
| options | <code>object</code> | an options hash |
| options.protocol | <code>string</code> | http or https |

**Example**  
```js
runtime.assetLoader.unpkg({
   React: 'react@16.7.0/umd/react.production.min.js'
 })
```