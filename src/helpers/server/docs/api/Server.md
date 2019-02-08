<a name="Server"></a>

## Server
The Server Helper provides a generic interface on top of any server process that can be
created, configured, started, and stopped.  By default we provide an instance of an express app
with some common middleware enabled out of the box.  Technically the server helper is should be framework
agnostic, and can rely on dependency injection to use express, hapi, feathers.js, or whatever

**Kind**: global class  

* [Server](#Server)
    * _instance_
        * [.isCacheable](#Server+isCacheable)
        * [.isServerHelper](#Server+isServerHelper)
        * [.registryProp](#Server+registryProp)
        * [.lookupProp](#Server+lookupProp)
        * [.strictMode](#Server+strictMode)
        * [.isObservable](#Server+isObservable)
        * [.providerTypes](#Server+providerTypes)
        * [.status](#Server+status)
        * [.start()](#Server+start)
    * _static_
        * [.observables()](#Server.observables)

<a name="Server+isCacheable"></a>

### server.isCacheable
By setting the Server class to be cacheable, we will always get the same instance of a server
when we ask for it by name with the same options we used when we requested it previously.

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+isServerHelper"></a>

### server.isServerHelper
This helps us distinguish provider implementations which export a subclass of Server
instead of a plain javascript object module with provider types

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+registryProp"></a>

### server.registryProp
The Server helper will use this value for the name of the Server helper registry
which is aware of all of the available servers that can be created and started

**Kind**: instance property of [<code>Server</code>](#Server)  
**Example**  
```js
const runtime = require('@skypager/node')
 const myServer = {
   appWillMount(app) { }
 }

 runtime.servers.register('@my/server', myServer)
```
<a name="Server+lookupProp"></a>

### server.lookupProp
The Server helper will use this value for the name of the Server helper factory function
which is responsible for creating Server helper instances using the id that provider was registered with.

**Kind**: instance property of [<code>Server</code>](#Server)  
**Example**  
```js
const runtime = require('@skypager/node').use('@my/server')
const myServer = runtime.server('@my/server', { port: 3000 })
```
<a name="Server+strictMode"></a>

### server.strictMode
With strictMode set to true, only valid provider / option types will be used

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+isObservable"></a>

### server.isObservable
By setting the Server class to be observable, we opt-in to various transformations and events that
get fired in the global event bus system.

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+providerTypes"></a>

### server.providerTypes
providerTypes describe the shape of the server helper implementation module.

in the example below, the server is registered with a module, considered the provider

the provider interface allows for a module to serve as the default source of truth for an implementation
of a Server helper.

**Kind**: instance property of [<code>Server</code>](#Server)  
**Example**  
```js
const runtime = require('@skypager/node')

 const myServerProvider = {
   async serverWillStart(app) {
     return app
   }

   appWillMount(app) {
     app.get('/whatever', (req) => res.json({ whatever: true }))
   }
 }

 runtime.servers.register('my-server', myServerProvider)
```
<a name="Server+status"></a>

### server.status
Returns any recorded stats tracked by this server

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+start"></a>

### server.start()
**Kind**: instance method of [<code>Server</code>](#Server)  
**Access**: public  
<a name="Server.observables"></a>

### Server.observables()
Since our Helper class is set to be observable, each instance of the server helper that is created will
be extended with the following observable property interface.

**Kind**: static method of [<code>Server</code>](#Server)