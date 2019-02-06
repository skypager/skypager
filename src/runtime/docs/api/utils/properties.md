## Mixins

<dl>
<dt><a href="#PropertyUtils">PropertyUtils</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#hideProperty">hideProperty</a></dt>
<dd><p>creates a non enumerable property on the target object</p>
</dd>
<dt><a href="#hideProperty">hideProperty</a></dt>
<dd><p>creates a non enumerable property on the target object</p>
</dd>
<dt><a href="#lazy">lazy</a> ⇒ <code>Object</code></dt>
<dd><p>Creates a lazy loading property on an object.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#hideProperty">hideProperty</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#propertyUtils">propertyUtils(target)</a> ⇒ <code>Object</code></dt>
<dd><p>Creates some functions that are useful when trying to decorate objects with hidden properties or getters,
or lazy loading properties, etc.  I use this a lot inside of constructor functions for singleton type objects.</p>
</dd>
<dt><a href="#applyInterface">applyInterface(target, methods, options)</a></dt>
<dd></dd>
<dt><a href="#hideProperties">hideProperties(target, properties)</a> ⇒ <code>Object</code></dt>
<dd><p>Create a bunch of hidden or non-enumerable properties on an object.
Equivalent to calling Object.defineProperty with enumerable set to false.</p>
</dd>
<dt><a href="#hideGetter">hideGetter(target, name, fn, options)</a> ⇒ <code>Object</code></dt>
<dd><p>Create a hidden getter property on the object.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#MixinOptions">MixinOptions</a> : <code>Object.&lt;String, function()&gt;</code></dt>
<dd></dd>
</dl>

<a name="PropertyUtils"></a>

## PropertyUtils
**Kind**: global mixin  
<a name="hideProperty"></a>

## hideProperty
creates a non enumerable property on the target object

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | the target object |
| attributeName | <code>String</code> |  |
| function | <code>function</code> | which returns a value |
| definePropertyOptions | <code>Object</code> |  |

<a name="hideProperty"></a>

## hideProperty
creates a non enumerable property on the target object

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | the target object |
| attributeName | <code>String</code> |  |
| value | <code>\*</code> |  |
| definePropertyOptions | <code>Object</code> |  |

<a name="lazy"></a>

## lazy ⇒ <code>Object</code>
Creates a lazy loading property on an object.

**Kind**: global variable  
**Returns**: <code>Object</code> - Returns the target object  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | The target object to receive the lazy loader |
| attribute | <code>String</code> | The property name |
| fn | <code>function</code> | The function that will be memoized |
| enumerable | <code>Boolean</code> | Whether to make the property enumerable when it is loaded |

<a name="hideProperty"></a>

## hideProperty
**Kind**: global constant  
<a name="propertyUtils"></a>

## propertyUtils(target) ⇒ <code>Object</code>
Creates some functions that are useful when trying to decorate objects with hidden properties or getters,
or lazy loading properties, etc.  I use this a lot inside of constructor functions for singleton type objects.

**Kind**: global function  
**Returns**: <code>Object</code> - Returns an object with some wrapper functions around Object.defineProperty  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | This is the object you intend to be decorating |

<a name="applyInterface"></a>

## applyInterface(target, methods, options)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | an object to extend |
| methods | <code>Mixin</code> | an object of functions that will be applied to the target |
| options | [<code>MixinOptions</code>](#MixinOptions) | options for the mixin attributes |

<a name="hideProperties"></a>

## hideProperties(target, properties) ⇒ <code>Object</code>
Create a bunch of hidden or non-enumerable properties on an object.
Equivalent to calling Object.defineProperty with enumerable set to false.

**Kind**: global function  
**Returns**: <code>Object</code> - The target object  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | The target object which will receive the properties |
| properties | <code>Object</code> | =             {} a key/value pair of |

<a name="hideGetter"></a>

## hideGetter(target, name, fn, options) ⇒ <code>Object</code>
Create a hidden getter property on the object.

**Kind**: global function  
**Returns**: <code>Object</code> - Returns the target object  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | The target object to define the hidden getter |
| name | <code>String</code> | The name of the property |
| fn | <code>function</code> | A function to call to return the desired value |
| options | <code>Object</code> | =             {} Additional options |
| options.scope | <code>Object</code> | The scope / binding for the function will be called in, defaults to target |
| options.args | <code>Array</code> | arguments that will be passed to the function |

<a name="MixinOptions"></a>

## MixinOptions : <code>Object.&lt;String, function()&gt;</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| partial | <code>Array</code> | an array of objects to be passed as arguments to the function |
| right | <code>Boolean</code> | whether to append the arguments |
| insertOptions | <code>Boolean</code> | whether to pass an empty object as the first arg automatically |
| hidden | <code>Boolean</code> | make the property non-enumerable |
| configurable | <code>Boolean</code> | make the property non-configurable |