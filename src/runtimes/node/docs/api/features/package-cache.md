<a name="PackageCacheFeature"></a>

## PackageCacheFeature
The Package Cache Feature provides a package specific JSON cache store for saving snapshots of selector functions

**Kind**: global class  
<a name="PackageCacheFeature.snapshot"></a>

### PackageCacheFeature.snapshot([options], ...args) ⇒ <code>Object</code>
Build a snapshot from certain selector functions

**Kind**: static method of [<code>PackageCacheFeature</code>](#PackageCacheFeature)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | options |
| options.selectors | <code>Array.&lt;String&gt;</code> |  | an array of selector functions to use to build the snapshot |
| ...args | <code>\*</code> |  |  |