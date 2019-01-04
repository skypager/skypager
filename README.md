# Skypager
> Universal, Fully Integrated, Cross Platform JavaScript Container 

[![CircleCI](https://circleci.com/gh/skypager/skypager/tree/master.svg?style=svg)](https://circleci.com/gh/skypager/skypager/master) [![Windows Build status](https://ci.appveyor.com/api/projects/status/j83kh674nbsl3us1/branch/master?svg=true)](https://ci.appveyor.com/project/soederpop/skypager/branch/master)

Skypager is not like a traditional JavaScript framework, instead it gives JavaScript developers the pieces we need to build our own own frameworks on top of the "many different modules" we use (from repositories like NPM, and our own). 

It makes it easier to build applications by helping us think about them in distinct layers, composed from separate layers in your portfolio   

In a typical Web Application your top layer is the one the users see and interact with: all of your URLs and the UI that gets rendered at each one.  Underneath that layer, are all of the layers that we work in as designers, developers, testers, and architects.  These layers happen to be the ones the user never sees, and generally won't care about in as much as there are no obvious performance, security, or usability issues to be experienced.  Thankfully, this means that it is possible to get these layers working how you want, built, tested, deployed, and cached until they change, freeing you up to focus on the top layer which matters most to the user.  However, it is unfair to just separate these layers into the ones the user sees, and everything else.  Even beneath the surface, there are many "natural" layers that correspond to the different skillsets and concerns required to deliver a consistent and pleasing user experience.

This approach requires not only tools, but a different way of thinking about how we organize our JavaScript codebases.  Skypager attempts to provide us with both.

With this layered approach, Skypager makes it easy to build cross platform JavaScript projects, which can run on the web, server, desktop, or react-native environment. By providing architectural patterns and tools that help us take advantage of the natural layers in our software projects, Skypager takes the write once, run everywhere style (a.k.a. universal or isomorphic javascript.) to the extreme.

Skypager is designed for people who want to build their own portfolios, or monorepos, consisting of their own modules, while leveraging all of the problems that have already been solved by other people and published to NPM.  If you have a handful of apps, all which use the same "stack" of third party libraries, and you want the ability to standardize all of these apps and make it easier to share the progress you make on one app with all of the other apps, Skypager is for you.

Skypager enables you to develop the different layers of your portfolio separately from one another, so that the components and modules which rarely change are built once, cached, and re-used until they change again.  The pieces of the app which change more often, are developed in a separate layer.  This is especially ideal for projects which multiple people or multiple teams contribute to, as the different layers that naturally emerge are very inline with the different teams and skillsets which contribute to a modern application.

![Team Layers](docs/team-layers.png)

In the graphic above, each box might represent a completely different department in a product organization.  

If you're a solo full stack developer, each box represents a separate concern that you need to address using whichever hat you're wearing at the time.  You might be in charge of everything, but use off the shelf themes from bootstrap or semantic ui, or your client may be providing these visual elements for you.  You should be able to easily incorporate, or swap out any element, without causing too much stress on all of the other parts.

In other words, if you don't already manage these aspects of an application as their own independent layer, you are probably having a much harder time than you need to be when changing things in the different layers.

## Installation

You can install the single package `skypager` which provides the latest versions from the '@skypager/*' portfolio

```shell
$ yarn add skypager --save 
```

Or you can install the inividual packages directly:

```shell
$ yarn add @skypager/cli @skypager/node --dev # for single page apps and not servers, these can be devDependencies
$ yarn add @skypager/web --save # for the browser builds, this is a runtime / production dependency
```

## Usage

**Usage with webpack or other bundlers**

```javascript
// this will be either @skypager/node or @skypager/web depending on your build platform
import runtime from 'skypager'

runtime.start().then(() => {
  console.log('Skypager Runtime Is Started')
})
```

**Usage via script tag**

```html
<script type="text/javascript" src="https://unpkg.com/@skypager/web"></script>
<script type="text/javascript">
  skypager.start().then(() => {
    console.log('Skypager Runtime is Ready')
  })
</script>
```

## Easily Extendable

The `runtime`, while useful by itelf, is designed to be extended.  When you solve a problem that all of the applications in your portfolio can benefit from, you can solve it in a separate module and create a runtime which automatically has access to this module and can lazy load it when needed.

```javascript
import runtime from '@skypager/runtime'
import MyNotificationsFeature from '@my/features-notifications'
import MyLoggingFeature from '@my/features-logging'
import MyAnalyticsFeature from '@my/features-analytics'
import MyUserAuthenticationFeature from '@my/features-authentication'

const myRuntime = runtime
  .use(MyUserAuthenticationFeature)
  .use(MyNotificationsFeature)
  .use(MyLoggingFeature)
  .use(MyAnalyticsFeature)

export default myRuntime 
```

With this module, you have encoded a standard base layer that all of your apps can share.  These apps should never need to solve authentication, notifications, logging, or analytics on their own.  They get the benefit of these features just by using your runtime.

## Motivation

In 2019, JavaScript has become a universal language that empowers people to deploy applications on every platform, device, or form factor you can imagine.  There is an open source package for almost any thing you could need help building.  We can write code once in the most modern form of the language, and transpile code to support the oldest browsers out there.  This is a somewhat recent development in JavaScript, but it eliminates any tradeoffs we once had to make when choosing how we write JavaScript, given that it might be run on older browsers which don't support our features. 

All of these capabilities come with a cost in complexity, and can become barriers that prevent people from being able to contribute to a project.  Many tools have emerged to address this problem in the time I have spent developing Skypager: tools which aim to provide developers with a single dependency solution offering zero config developer experiences.  Skypager also provides a similar tool, however I think that zero config single dependency tools address this problem from a very limited perspective since once build tooling is standardized, there is still an entire universe of other things which multiple projects have in common, and not only is it tedious to keep repeating them, it makes software development much more expensive than it needs to be, and forces us to spend more time on things which our users don't really care about. With JavaScript we have very little in the way of standardizing and re-using these patterns.  At best they live in a coding standards document and are taught to every developer who joins the project.

Skypager is my attempt to codify and modularize all of the things I've seen my applications have in common in the 20 years I have been developing JavaScript applications.

## Runtime Concept

Regardless of which framework you are using, if you're using a single page app, or rendering pages on the server, you're probably using some routing DSL (like Express, Hapi, or React-Router, or many others) to declare which URLs map to which pages.  Even if you're building a completely static website, your folder organization is itself a routing DSL.

If you have multiple apps which use the same libraries, chances are most of the project's source trees are very similar to each other.  The code which is different in each app, odds are, can be understood quickest by looking at the routes and seeing which modules are used to render them in response to a user's request.  (If you've used Webpack or any other module bundler, these are your "entry" points.)

Each of the pages in your app, should generally not know or care about how they were rendered.  This is especially true when you want to render a page first on the server, and then let client side JS handle the rest, without changing the code.  

The `runtime` idea exists to provide the code in this top level UX layer with a single object to talk to which behaves the same way regardless of which environment you're running.  It takes care of abstracting the many differences away, so your code can focus on what makes it unique for your user.

Skypager provides a few base runtimes:

- [@skypager/runtime](src/runtime) - universal platform agnostic base runtime, which provides observable state, and other utilities which are useful in any context
- [@skypager/node](src/runtimes/node) - the universal runtime extended with node specific features and helpers, used in server side scripts / long running processes (e.g. web or api servers)
- [@skypager/web](src/runtimes/web) - the browser runtime extended with browser specific features and helpers, used in your browser builds

And the following runtimes are being ported over from older versions of skypager

- [@skypager/electron](ROADMAP.md) - either the node or web runtime, extended with electron specific libraries and utilities depending if you're in the renderer or main electron process
- [@skypager/native](ROADMAP.md) - the universal runtime extended with react-native specific features 

The value of this approach means when you're developing React Components, you can have them talk to the runtime instead of the platform.  When you want to re-use this component in another platform or process, it should be no big deal to do so.

Similarly, when you want to reuse these components across different apps which also use the `runtime`, you don't need to make so many changes as your apps will have a uniform pattern for how they get their state.

## Docker for the Frontend

I think of Skypager as being the equivalent of Docker for JavaScript applications running in the browser, on the server, on phones, desktops, in space.  It provides you with a system for working with JavaScript modules in cacheable layers, just like Docker.  This makes it possible to separate your work into layers, where the things which change the least, but are most foundational, are at the bottom.  The things which change the most, and are at the top.

![Layers](docs/layers.png)

Using this approach makes releasing cross platform JavaScript much easier, because your top level application layer is abstracted away from the underlying platform layer.  These underlying platform layers are aware of this, and perform dependency injection

### Layers are just collections of modules 

A Layer is just a group of dependencies that work together.  Skypager provides a [Helper Base Class](docs/about-helpers.md) for standardizing different types of modules based on when and where in the application process they are used:

- [The Rest Client Helper](src/helpers/client) - a wrapper around the axios REST client.  As a developer you can write a friendly, cross-platform interface for making calls with axios.
- [The Server Helper](src/helpers/server) - a wrapper around any server that can be started and stopped.  By default provides an express server with history api fallback and static file serving enabled.
- [The Feature Helper](src/runtime/helpers/feature.js) - a module that provides an interface to specific functionality on the running platform. Can be `enable()d` or `disable()d`
- [The Google Sheets Helper](src/helpers/sheet) - a module that loads data as JSON from a google spreadsheet.  As a developer you can write an interface for reading, transforming, or updating this data.
- [The Sketch Document Helper](src/helpers/sketch) - a module that lets you load a designers sketch files as javascript modules.  This can be used to power various code generation apps, as well as anything else you can think of.

The Runtime is responsible for activating each of these layers for you, relying on [The Inversion of Control Technique](docs/inversion-of-control-framework.md) for your modules.  (aka Don't call me, I'll call you.)

## Example Projects

Skypager is a powerful framework which can be used to build any kind of app, here are some examples.

- [Sheets Server](src/examples/sheets-server) A REST API that lets you browse your google spreadsheets, and request them in JSON form

## Local Development

In order to develop and test this project locally, you will need a service account json for a google cloud project.  It should have the google drive and sheets api's enabled.

In order to run the tests, This file's content needs to either be stored in an environment variable `SERVICE_ACCOUNT_DATA` or you will need to copy this file to

- src/helpers/sheet/secrets/serviceAccount.json
- src/examples/sheets-server/secrets/serviceAccount.json

See our [Circle CI Config](.circleci/config.yml) for an example of how I set up a project in CI to run tests.
