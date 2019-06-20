# Babel Registry

The Babel Registry is an index of all of the available JavaScript files you can work with.

Calling `runtime.scripts.discover()` will scan your current project's source folders and look for these files for you.

Registries in skypager are useful for partially loading modules based on some reference (e.g. a path to a file).  This lets you
query for modules based on whatever minimal information you need, and load the full module into memory and perform any expensive 
calculations only when you need it.

When working with a large collection of JavaScript modules, this can come in handy, as parsing the AST can be expensive and time consuming.

## Factory Function

The Babel scripts registry exists to provide an aggregate view of all of the available JavaScript files in a project.

When you want to work with an individual document instance, the `runtime.script` factory function will look up the document attributes in the registry,
and then create an instance of the `Babel` helper using those attributes.

## API

### register()

Registers an Babel helper providers with the registry.  At a minimum this could be the path to the file on disk, or a string of its contents.

### discover()

Scans the project file system to find `.js` or `.jsx` files.

### allInstances()

Returns an array of Babel instances in the registry. 

### allMembers()

Returns an object, keyed by the document ID, whose values are the raw javascript objects that power the Babel script instance.  