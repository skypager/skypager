## Classes

<dl>
<dt><a href="#Runtime">Runtime</a></dt>
<dd><p>The Runtime is similar to the window or document global in the browser, or the module / process globals in node.
You can extend Runtime and define your own process global singleton that acts as a state machine, event emitter,
module registry, dependency injector.  Typically you can just do this with features instead of subclassing.</p>
</dd>
</dl>

## Mixins

<dl>
<dt><a href="#Stateful">Stateful</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#whenPrepared">whenPrepared()</a></dt>
<dd></dd>
<dt><a href="#whenReadyAsync">whenReadyAsync()</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Mixin">Mixin</a> : <code>Object.&lt;string, function()&gt;</code></dt>
<dd></dd>
<dt><a href="#MixinOptions">MixinOptions</a> : <code>Object.&lt;string&gt;</code></dt>
<dd></dd>
<dt><a href="#Logger">Logger</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Runtime"></a>

## Runtime
The Runtime is similar to the window or document global in the browser, or the module / process globals in node.
You can extend Runtime and define your own process global singleton that acts as a state machine, event emitter,
module registry, dependency injector.  Typically you can just do this with features instead of subclassing.

**Kind**: global class  

* [Runtime](#Runtime)
    * [new Runtime(options, context, middlewareFn)](#new_Runtime_new)
    * _instance_
        * [.contextTypes](#Runtime+contextTypes)
        * [.optionTypes](#Runtime+optionTypes)
        * [.defaultContext](#Runtime+defaultContext)
        * [.contextTypes](#Runtime+contextTypes)
        * [.optionTypes](#Runtime+optionTypes)
        * [.defaultContext](#Runtime+defaultContext)
        * [.defaultOptions](#Runtime+defaultOptions)
        * [.events](#Runtime+events)
        * [.argv](#Runtime+argv)
        * [.isBrowser](#Runtime+isBrowser)
        * [.isNode](#Runtime+isNode)
        * [.isElectron](#Runtime+isElectron)
        * [.isElectronRenderer](#Runtime+isElectronRenderer)
        * [.isReactNative](#Runtime+isReactNative)
        * [.isDebug](#Runtime+isDebug)
        * [.isCI](#Runtime+isCI)
        * [.isDevelopment](#Runtime+isDevelopment)
        * [.isTest](#Runtime+isTest)
        * [.isProduction](#Runtime+isProduction)
        * [.use(extension, stage)](#Runtime+use) ⇒ [<code>Runtime</code>](#Runtime)
        * [.set(path, value)](#Runtime+set) ⇒ <code>?</code>
        * [.get(path, defaultValue)](#Runtime+get) ⇒ <code>?</code>
        * [.result(path, defaultValue)](#Runtime+result) ⇒ <code>?</code>
        * [.has(path, defaultValue)](#Runtime+has) ⇒ <code>Boolean</code>
        * [.invoke(functionAtPath, ...args)](#Runtime+invoke) ⇒ <code>?</code>
        * [.onRegistration(registryPropName, callback)](#Runtime+onRegistration)
        * [.registerHelper(helperName, helperClass)](#Runtime+registerHelper) ⇒ <code>Class</code>
        * [.mixin(mixin, options)](#Runtime+mixin)
        * [.whenStarted(fn)](#Runtime+whenStarted) ⇒ [<code>Runtime</code>](#Runtime)
        * [.whenStartedAsync()](#Runtime+whenStartedAsync) ⇒ [<code>PromiseLike.&lt;Runtime&gt;</code>](#Runtime)
        * [.whenPrepared(fn, onError)](#Runtime+whenPrepared) ⇒ [<code>PromiseLike.&lt;Runtime&gt;</code>](#Runtime)
        * [.whenPreparedAsync()](#Runtime+whenPreparedAsync) ⇒ [<code>PromiseLike.&lt;Runtime&gt;</code>](#Runtime)
        * [.replaceState([newState], [cb])](#Runtime+replaceState) ⇒ <code>Object</code>
        * [.setState([newState], [cb])](#Runtime+setState) ⇒ <code>Object</code>
        * *[.stateDidChange()](#Runtime+stateDidChange)*
        * [.didCreateObservableHelper()](#Runtime+didCreateObservableHelper)
        * [.hashObject(anyObject)](#Runtime+hashObject)
        * [.createEntityFrom()](#Runtime+createEntityFrom)
        * [.slice(...properties)](#Runtime+slice) ⇒ <code>\*</code>
        * [.tryGet(objectPath, defaultValue)](#Runtime+tryGet)
        * [.selectCached(selectorId, ...args)](#Runtime+selectCached) ⇒ <code>PromiseLike.&lt;\*&gt;</code>
        * [.select(selectorId, ...args)](#Runtime+select) ⇒ <code>PromiseLike.&lt;\*&gt;</code>
        * [.selectThru(selectorId, ...args)](#Runtime+selectThru) ⇒ <code>PromiseLike.&lt;\*&gt;</code>
        * [.selectChainThru(selectorId, ...args)](#Runtime+selectChainThru) ⇒ <code>LodashChain</code>
        * [.selectChain(selectorId, ...args)](#Runtime+selectChain) ⇒ <code>PromiseLike.&lt;\*&gt;</code>
        * ["stateWillChange"](#Runtime+event_stateWillChange)
        * ["stateWillReplace"](#Runtime+event_stateWillReplace)
        * ["stateWillChange"](#Runtime+event_stateWillChange)
    * _static_
        * [.framework](#Runtime.framework) ⇒ [<code>Runtime</code>](#Runtime)
        * [.registerHelper(helperName, helperClass)](#Runtime.registerHelper) ⇒ <code>Class</code>
        * [.createSingleton()](#Runtime.createSingleton) ⇒ [<code>Runtime</code>](#Runtime)

<a name="new_Runtime_new"></a>

### new Runtime(options, context, middlewareFn)
Create a new instance of the skypager.Runtime


| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | the props, or argv, for the runtime instance at the time it is created |
| context | <code>object</code> | the context, environment, static config, or similar global values that may be relevant to some component in the runtime |
| middlewareFn | <code>function</code> | this function will be called when the runtime is asynchronously loaded and the plugins have run * |

<a name="Runtime+contextTypes"></a>

### runtime.contextTypes
The Context Types API defines a schema for properties that will be made available via the runtime's context system.

    You can specify your own context types when you are extending the Runtime class.  If you are using Skypager as
    a global singleton, you won't have the opportunity if you just require('skypager-runtime'), so you can define
    a global variable SkypagerContextTypes and it will use these instead.

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
<a name="Runtime+optionTypes"></a>

### runtime.optionTypes
The Options Types API defines a schema for properties that will be attached to the runtime as an options property.

    You can specify your own options types when you are extending the Runtime class.  If you are using Skypager as
    a global singleton, you won't have the opportunity if you just require('skypager-runtime'), so you can define
    a global variable SkypagerOptionTypes and it will use these instead.

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
<a name="Runtime+defaultContext"></a>

### runtime.defaultContext
The Default Context Object

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
<a name="Runtime+contextTypes"></a>

### runtime.contextTypes
Returns the contextTypes declarations for our Runtime class.

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+optionTypes"></a>

### runtime.optionTypes
the optionTypes declarations for our Runtime class

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+defaultContext"></a>

### runtime.defaultContext
Returns the default context value for this runtime

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+defaultOptions"></a>

### runtime.defaultOptions
Returns the default options for this runtime

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+events"></a>

### runtime.events
**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
<a name="Runtime+argv"></a>

### runtime.argv
argv will refer to the initial options passed to the runtime, along with any default values that have been set

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
<a name="Runtime+isBrowser"></a>

### runtime.isBrowser
Returns true if the runtime is running inside of a browser.

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isNode"></a>

### runtime.isNode
Returns true if the runtime is running inside of node.

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isElectron"></a>

### runtime.isElectron
Returns true if the runtime is running inside of electron

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isElectronRenderer"></a>

### runtime.isElectronRenderer
Returns true if the runtime is running inside of electron's renderer process

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isReactNative"></a>

### runtime.isReactNative
Returns true if the runtime is running inside of React-Native

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isDebug"></a>

### runtime.isDebug
Returns true if the process was started with a debug flag

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isCI"></a>

### runtime.isCI
Returns true if the runtime is running in node process and common CI environment variables are detected

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isDevelopment"></a>

### runtime.isDevelopment
returns true when running in a process where NODE_ENV is set to development, or in a process started with the development flag

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isTest"></a>

### runtime.isTest
returns true when running in a process where NODE_ENV is set to test, or in a process started with the test flag

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+isProduction"></a>

### runtime.isProduction
returns true when running in a process where NODE_ENV is set to production, or in a process started with the test flag

**Kind**: instance property of [<code>Runtime</code>](#Runtime)  
**Read only**: true  
<a name="Runtime+use"></a>

### runtime.use(extension, stage) ⇒ [<code>Runtime</code>](#Runtime)
Extend the runtime with a middleware function, plugin object, or helper class.

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type | Description |
| --- | --- | --- |
| extension | <code>function</code> \| <code>Object</code> \| <code>Feature</code> \| <code>Helper</code> | an object that meets the requirements to be an extension |
| stage | <code>String</code> \| <code>Object</code> | which stage to run this middleware in (INITIALIZING, PREPARING, STARTING) |

**Example**  
```js
chain them as necessary

runtime
 .use((next) => { })
 .use({ attach(runtime) { } })
 .use(MyFeature)
 .use('some-feature-thats-been-registered')
```
**Example**  
```js
using a function, deferred until runtime.start() is called

runtime.use((next) => {
 doSomethingAsync().then(() => next()).catch((error) => next(error))
})
```
**Example**  
```js
using a plugin object with an attach function

runtime.use({
 attach(runtime) {
   console.log('runs immediately')
   runtime.use((next) => {
     console.log('called at runtime start() like normal')
   })
 }
})
```
**Example**  
```js
specifying the PREPARING stage to run before any starting middlewares are called

runtime
 .use(runOnStart)
 .use(runBeforeStart, 'PREPARING')
```
**Example**  
```js
using a feature class will register and enable the feature

export default class MyFeature extends Feature {
 featureId = 'registered-in-the-registry-with-this'

 featureWasEnabled(config) {
   console.log('enabled with', config) // enabled with { option: 'passed to feature enable' }
 }
}

// in another module
import MyFeature from 'myFeature'

runtime.use(MyFeature, { option: 'passed to feature enable' })
```
**Example**  
```js
passing a string which refers to an already existing feature

runtime.use('some-registered-feature')
```
<a name="Runtime+set"></a>

### runtime.set(path, value) ⇒ <code>?</code>
Set the value at an object path. Uses lodash.set

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| path | <code>\*</code> | 
| value | <code>\*</code> | 

<a name="Runtime+get"></a>

### runtime.get(path, defaultValue) ⇒ <code>?</code>
Get the value at an object path.  Uses lodash.get

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| path | <code>String</code> | 
| defaultValue | <code>\*</code> | 

<a name="Runtime+result"></a>

### runtime.result(path, defaultValue) ⇒ <code>?</code>
Get the value at an object path. If that path is a function, we'll call it.
Uses lodash.result

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| path | <code>\*</code> | 
| defaultValue | <code>\*</code> | 

<a name="Runtime+has"></a>

### runtime.has(path, defaultValue) ⇒ <code>Boolean</code>
Check if runtime has a property

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| path | <code>\*</code> | 
| defaultValue | <code>\*</code> | 

<a name="Runtime+invoke"></a>

### runtime.invoke(functionAtPath, ...args) ⇒ <code>?</code>
Invoke a function at a nested path

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| functionAtPath | <code>\*</code> | 
| ...args | <code>\*</code> | 

<a name="Runtime+onRegistration"></a>

### runtime.onRegistration(registryPropName, callback)
If you have code that depends on a particular helper registry being available
on the runtime, you can pass a callback which will run when ever it exists and
is ready.  This is useful for example, when developing a feature which includes a
client and a server helper to go along with it.  If the runtime is web, you wouldn't
have a server helper so you wouldn't want to load that code.  If the same runtime is
used on a server, then you would run that code.

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type | Description |
| --- | --- | --- |
| registryPropName | <code>string</code> | the name of the registry you want to wait for |
| callback | <code>function</code> | a function that will be called with runtime, the helperClass, and the options passed when attaching that helper |

**Example** *(Conditionally running code when the servers helper is attached)*  
```js

runtime.onRegistration("servers", () => {
 runtime.servers.register('my-server', () => require('./my-server'))
})
```
<a name="Runtime+registerHelper"></a>

### runtime.registerHelper(helperName, helperClass) ⇒ <code>Class</code>
Register a Helper class as being available to our Runtime class

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  
**Returns**: <code>Class</code> - the helper class you registered  

| Param | Type | Description |
| --- | --- | --- |
| helperName | <code>String</code> | the name of the helper class |
| helperClass | <code>Class</code> | a subclass of Helper |

<a name="Runtime+mixin"></a>

### runtime.mixin(mixin, options)
A Mixin is an object of functions.  These functions will get created as properties on this instance.

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| mixin | [<code>Mixin</code>](#Mixin) | 
| options | [<code>MixinOptions</code>](#MixinOptions) | 

<a name="Runtime+whenStarted"></a>

### runtime.whenStarted(fn) ⇒ [<code>Runtime</code>](#Runtime)
Accepts a callback function which will be called when the runtime is started

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="Runtime+whenStartedAsync"></a>

### runtime.whenStartedAsync() ⇒ [<code>PromiseLike.&lt;Runtime&gt;</code>](#Runtime)
Returns a promise that will resolve when the runtime is started.

**Kind**: instance method of [<code>Runtime</code>](#Runtime)  
<a name="Runtime+whenPrepared"></a>

### runtime.whenPrepared(fn, onError) ⇒ [<code>PromiseLike.&lt;Runtime&gt;</code>](#Runtime)
Takes a callback