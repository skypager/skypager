# Helper

The Helper class is what makes Skypager the Helpful JavaScript framework. 

A Helper class can define a universal, common API for doing generic things, while delegating the actual responsibility to competing, specific implementations of the hard work that exist in external modules that we depend on in our application. 

A Server helper can start / stop any server.  A Client helper can connect to any API.  An Authentication Feature helper can login to any auth provider's network and let the application know who the current user is, and if they're logged in or not. 

The Helper class defines a module type, or pattern.  A module is any JavaScript object that is loaded once, and cached in memory so that subsequent requires of that module are instant.  A module type or pattern simply states, this module can have exports named a, b, and c.  It must have exports named x, y, and z.  Additionally, export a should be a function, export b should be a number, etc.

```javascript
class Server extends Helper {
  static defaultOptions = {
    port: 3000,
    hostname: 'localhost' 
  }

  static optionTypes = {
    port: types.number.isRequired,
    host: types.string.isRequired
  }

  static providerTypes = {
    start: types.func.isRequired
  }  
}
```

It takes as part of its constructor, an arbitrary shaped object, called 'provider'

These objects can be any individual JavaScript module, whether a single file, a directory, a package on npm, a web assembly module built in rust.  These modules "provide" the implementation of a Helpers defined hook functions.  Typically you'll have folders in your JavaScript project, clients, pages, features, servers, etc.  A Helper can be used to load all of these modules in a consistent way.

The Helper class will use its knowledge about the module's shape (which properties it can or must export) to build any common, universal interface for working with all modules of this type.

A hypothetical example would be a Server Helper which any consumer can just

- start()
- stop()
- configure()

This adapter pattern can be used to incorporate literally any implementation of a server process in node.js, without having the consumer care about the particular details of how express, hapi, feathers, etc do these things under the hood. 

You can wrap every server API there is with this one common interface. Helpers allow us to define project components and standardize the way they are composed into a larger application. 

Helpers can attach a function, a.k.a a factory, to the runtime singleton.  For example, a server function which creates instances of server helpers powered by express, hapi, or whatever.

