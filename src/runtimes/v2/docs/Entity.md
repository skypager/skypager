# Entity

An `Entity` is an internal class for working with uniquely identifiable, cacheable JavaScript objects.  It can provide data,
functions which implement some abstract interface, and state.  It can be created with `options` that
can control its core behavior.

The `Entity` class takes a pure JavaScript object from a cache, and brings it to life as a stateful, observable, event emitting object.

The [Runtime](Runtime.md) singleton is an entity.  

The [Helper](Helper.md) instances it creates are entities.

This is because they are things that live as modules on disk, but when run by JavaScript are alive throughout
the lifecycle of the application.  They are the things with names that the program (or other programs on other machines) talks to and relies on.

All entities have of a `state` property that is an instance of [State](State.md).

All of your servers then, will have built in observability and common event APIs.