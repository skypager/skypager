# Skypager Runtime
> The Helpful JavaScript Framework

The Runtime class lets us implement the concept of a Container in JavaScript.

A Container consists of a single, declarative set of modules which get loaded in a certain order, each module has a unique hash that remains the same while the code remains the same.  In Docker, this hash is the layer id.  In a Web Browser, this would be the asset's ETag (an md5 hash of the code).  In node, this would be locked dependencies from a package.json with a lock file.  

Each module can be activated with options and config that might not be known until "the last minute".

This is another way of saying things which aren't hard coded, and not known until the code is deployed and started.

The Runtime can be used to package up framework components, which can declaratively be turned into an App.

## Core Classes

### [Runtime](src/Runtime.js)
> [Runtime API Docs](docs/Runtime.md)

### [Helper](src/Helper.js)
> [Helper API Docs](docs/Helper.md)

The Helper class is an abstract module type or pattern, intended to be subclassed (e.g. Server, Client, Feature, Repl).

A Helper can be attached to a Runtime or Helper instance.  Attaching a helper creates at least two properties on the parent,
a [Factory Function](docs/Helper.md#factory-functions) and a [Helper Registry](src/Helper.md#registry)

### [Feature](src/Feature.js)
> [Feature API Docs](docs/Feature.md)

### [Registry](src/Registry.js)
> [Registry API Docs](docs/Registry.md)


