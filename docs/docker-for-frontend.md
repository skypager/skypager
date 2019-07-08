# Docker for the Frontend

I think of Skypager as being the equivalent of Docker for JavaScript applications running in the browser, on the server, on phones, desktops, in space.  It provides you with a system for working with JavaScript modules in cacheable layers, just like Docker.  This makes it possible to separate your work into layers, where the things which change the least, but are most foundational, are at the bottom.  The things which change the most, and are at the top.

![Layers](layers.png)

Using this approach makes releasing cross platform JavaScript much easier, because your top level application layer is abstracted away from the underlying platform layer.  These underlying platform layers are aware of this, and perform dependency injection

>Layers are just collections of modules 

A Layer is just a group of dependencies that work together.  Skypager provides a [Helper Base Class](about-helpers.md) for standardizing different types of modules based on when and where in the application process they are used:

- [The Rest Client Helper](../src/helpers/client) - a wrapper around the axios REST client.  As a developer you can write a friendly, cross-platform interface for making calls with axios.
- [The Server Helper](../src/helpers/server) - a wrapper around any server that can be started and stopped.  By default provides an express server with history api fallback and static file serving enabled.
- [The Feature Helper](../src/runtime/helpers/feature.js) - a module that provides an interface to specific functionality on the running platform. Can be `enable()d` or `disable()d`
- [The Google Sheets Helper](../src/helpers/google-sheet) - a module that loads data as JSON from a google spreadsheet.  As a developer you can write an interface for reading, transforming, or updating this data.
- [The Google Documents Helper](../src/helpers/google-doc) - a module that loads data as JSON from a google document.  It loads all of your content, and document stylesheets, in an traversable AST form.
- [The Sketch Document Helper](../src/helpers/sketch) - a module that lets you load a designers sketch files as javascript modules.  This can be used to power various code generation apps, as well as anything else you can think of.
- [The Document Helper](../src/helpers/document) - provides helpers for loading markdown and javascript source modules as queryable entities, useful for automated codemods, code generation, documentation websites, and building databases from markdown or javascript module collections

The Runtime is responsible for activating each of these layers for you, relying on [The Inversion of Control Technique](inversion-of-control-framework.md) for your modules.  (aka Don't call me, I'll call you.)
