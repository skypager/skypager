<a name="Feature"></a>

## Feature ⇐ <code>Helper</code>
The Feature Class is used to provide an interface to something which can be
enaabled() and optionally configured() and possibly even have persistent state
throughout their object lifecyle.  Extended runtimes such as @skypager/node
are just a normal runtime which packages certain node specific features
and enable them automatically.

**Kind**: global class  
**Extends**: <code>Helper</code>  

* [Feature](#Feature) ⇐ <code>Helper</code>
    * _instance_
        * [.enable(cfg)](#Feature+enable)
    * _static_
        * [.allowAnonymousProviders](#Feature.allowAnonymousProviders)
        * [.isCacheable](#Feature.isCacheable)
        * [.createRegistry()](#Feature.createRegistry)
        * [.attach(runtime, options)](#Feature.attach) ⇒ <code>Runtime</code>

<a name="Feature+enable"></a>

### feature.enable(cfg)
Enable the feature.

**Kind**: instance method of [<code>Feature</code>](#Feature)  

| Param | Type |
| --- | --- |
| cfg | <code>object</code> \| <code>function</code> | 

<a name="Feature.allowAnonymousProviders"></a>

### Feature.allowAnonymousProviders
This lets you create feature instances using the `runtime.feature` factory method
without first registering the module with the `runtime.features` registry.

**Kind**: static property of [<code>Feature</code>](#Feature)  
<a name="Feature.isCacheable"></a>

### Feature.isCacheable
Since features are cacheable, you will get the same instance of the feature back
every time you call the `runtime.feature` factory method with the same arguments

**Kind**: static property of [<code>Feature</code>](#Feature)  
**Example**  
```js

 const one = runtime.feature('my-feature')
 const two = runtime.feature('my-feature')
 const three = runtime.feature('my-feature', { cacheHelper: false })

 console.assert(one.uuid === two.uuid)
 console.assert(three.uuid !== two.uuid)
```
<a name="Feature.createRegistry"></a>

### Feature.createRegistry()
**Kind**: static method of [<code>Feature</code>](#Feature)  
<a name="Feature.attach"></a>

### Feature.attach(runtime, options) ⇒ <code>Runtime</code>
Attaches this helper class to a runtime.

**Kind**: static method of [<code>Feature</code>](#Feature)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| runtime | <code>Runtime</code> |  | the runtime to attach the Feature registry to |
| options | <code>Object</code> |  | options to pass through to `Helper.attach` |
| [options.lookupProp] | <code>String</code> | <code>&#x27;feature&#x27;</code> | the name of the factory function to create on the runtime |
| [options.registryProp] | <code>String</code> | <code>&#x27;features&#x27;</code> | the name of the registry prop to create on the runtime |

