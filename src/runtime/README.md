# Skypager Runtime

This is the core Skypager Runtime, which is made up of:

- the [base Runtime class](src/runtime.js)
- the [base Helper class](src/helpers/helper.js)
- the [Feature Helper](src/helpers/feature.js)

In addition to these base framework classes, it provides a number of utilities used by the base framework:

- [Event Emitter](src/utils/emitter.js)
- [Entity](src/utils/entity.js)
- [String Inflection](src/utils/inflect.js)
- [Middleware Pipelines](src/utils/mware.js)
- [Object Hashing](src/utils/object-hash.js)
- [Path Matcher](src/utils/path-matcher.js)
- [Property Utils](src/utils/properties.js)
- [Array Query](src/utils/query.js)
- [String Utils](src/utils/string.js)

## Runtimes

A Runtime is a class which provides a global singleton instance that can be shared by all modules in a project.  

This global singleton instance is an observable state machine, with an event emitter, a vm, and helper module registries.

As a developer, you should be building everything that your projects have in common into runtime bundle that can be cached long term, 
and ideally shared between many projects. 

## Helpers

Helpers are a core component of the skypager framework.  They are used to define module types and categories, usually matching the plural names found in the the source code organization conventions.

For example, in one of your apps, you might have the following structure:

```
src
├── apps
│   ├── PublicApp.js
│   └── UserApp.js
├── components
│   ├── AddItem.js
│   ├── ItemList.js
│   ├── NavButton.js
├── features
│   ├── items.js
│   ├── permissions.js
│   ├── authentication.js
├── pages
│   ├── HomePage
│   │   └── index.js
│   ├── ItemPage
│   │   └── index.js
```

In this app, you might have the following `Helper` subclasses

```javascript
import { Helper } from '@skypager/runtime'

class App extends Helper { }
class Component extends Helper { }
class Feature extends Helper { }
class Page extends Helper { }
```

Which get used in the following way

```javascript
// src/runtime.js 
import runtime from '@skypager/runtime'
import App from 'helpers/App'
import Component from 'helpers/Component'
import Page from 'helpers/Page'
import PublicApp from 'apps/PublicApp'
import UserApp from 'apps/UserApp'
import HomePage from 'pages/HomePage'
import ItemPage from 'pages/ItemPage'
import ItemsFeature from 'features/items'
import PermissionsFeature from 'features/permissions'
import AuthenticationFeature from 'features/authentication'

runtime
  .use(App)
  .use(Component)
  .use(Page)

runtime.apps.register('public-app', () => PublicApp)
runtime.apps.register('user-app', () => UserApp)
runtime.pages.register('HomePage', () => HomePage)
runtime.features.register('items', () => ItemsFeature)
runtime.features.register('permissions', () => PermissionsFeature)
runtime.features.register('authentication', () => AuthenticationFeature)

// Enable all of our features and export the runtime.  The Module require.cache
// will ensure that we always have the same instance anywhere it is imported in the project
export default runtime
  .use('permissions')
  .use('authentication', {
    provider: 'oauth2',
    config: { token: "abc", callbackUrl: "/callback" }
  })
  .use('items')
```

The `Helper` class provides you with a way for defining object models on top of the different types of modules in your project.  

And once the runtime users a `Helper` (e.g. `runtime.use(App)`) you can register the available instances of these modules with module registries (such as `runtime.apps`, `runtime.features` and `runtime.pages` in the example above.)

With these systems in place, it is hopefully clearer how you might define an `App` as a collection of `Pages` and a `Page` as a collection of `Components` which use different `Features`.

Since an `App`, `Component`, `Feature`, or `Page` all have their own life cycles and configuration mechanisms, but common to each other, the `Helper` gives you a place to define what all `Features` `Pages` and `Apps` have in common in your project.

By modeling this logic in helper classes, you can better take advantage of declarative coding styles to compose all of the various pieces of your application together. 

Take a look at the example below. 

```javascript
// the module we wrote above for example
import runtime from './runtime'

const MyWebsite  = () => {
  const UserApp = runtime
    .app('UserApp', {
      pages: {
        "/" : "HomePage",
        "/items": "ItemsPage",
        "/items/:id": "ItemsPage"
      } 
    })  
}

let mySite

async function main() {
  await runtime.start()
  mySite = MyWebsite()

  return mySite.render()
}

main()
```

In this application, we're building an app by describing which pages it has and which features it depends on.

The `Helper` class is how we describe how these different types of pieces fit together.

## API Documentation

[Read the API Documentation](docs/api)

