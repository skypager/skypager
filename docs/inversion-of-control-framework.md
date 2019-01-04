### Inversion of Control framework

The Skypager Helper system provides the runtime with a registries that contain similar modules, and a function for creating instances of the helpers which use these modules.

The [The Feature Helper](src/runtime/helpers/feature.js) is a great example of this:  There is `runtime.features` and `runtime.feature()`  

Any application can be separated into entry points ( screens, pages, endpoints, commands ) 

And once inside that entry point, we should be able to clearly identify the features that are available to be interacted with. 

A `Feature` is any concept that can

1) tell the program whether it is "supported" in the current context 
2) be enabled with options, or configured dynamically based
3) provide a public API to the program

And so the `Feature` class provides a registry of modules which meet these requirements.

```javascript
export const shortcut = 'myFeature'

// only supported on  node in development or test environments
export function isSupported() {
  const { runtime } = this
  return runtime.isNode && !runtime.isProduction
} 

/**
 * @param {Object} options
 * @param {String} options.type - the type to use
 */
export function featureWasEnabled({ type }) {
  switch(type) {
    // do something 
  }  
}

export function methodOne() {

}

export function methodTwo() {

}

export const featureMethods = ['methodOne', 'methodTwo']
```

So when you need to use `myFeature`

```javascript
runtime.features.register('my-feature', () => require('./my-feature'))
const myFeature = runtime.feature('my-feature') 

myFeature.enable()
myFeature.methodOne()
```

What this allows you to do is standardize the way everyone who contributes to your project delivers a feature, so that anyone else who wants to
use that feature can just enable it and use its public API.

One thing I've developed a lot with this pattern is authentication.

From the perspective of a UI, when I want to use authentication I either want to login, logout, or know who the current user is.

There are dozens of different ways and apis with their own differing styles, but at the end of the day they can all be normalized to 
provide this information in a consistent way.  

In the example below, we see how a feature allows for this kind of dynamicism.  A generic authentication feature which lets you use firebase, aws, or anything else under the hood.

```javascript
export const shortcut = 'auth'

export function login() {
  return this.authProvider.login()
}

export function logout() {
  return this.authProvider.logout()
}

export function getCurrentUser() {
  return this.authProvider.getCurrentUser()
}

export function featureWasEnabled({ type = "firebase", config }) {
  switch(type) {
    case 'firebase':
      this.authProvider = runtime.feature('auth/firebase') 
      this.authProvider.enable(config)
      break
    default:
      this.authProvider = runtime.feature('auth/aws') 
      this.authProvider.enable(config)
      break
  }
}
```

Now in your runtime you can extend the runtime with these features.

```javascript
import runtime from '@skypager/web'
import * as AuthFeature from './src/features/auth'

runtime.features.register('auth', () => AuthFeature)

export default runtime
```

Build it, test it, cache it, and forget it.

So in your applications, they're available to be used

```javascript
import runtime from './runtime'

runtime.feature('auth').enable({ type: 'firebase', config: {} })

runtime.auth.login(username, password).then(() => {
  console.log('[AUTH] Current User', runtime.auth.currentUser)
})
```

and when your customer says they want to use AWS instead of Firebase, you can say no problem:

```javascript
runtime.feature('auth').enable({ type: 'aws', config: {} })

runtime.auth.login(username, password).then(() => {
  console.log('[AUTH] Current User', runtime.auth.currentUser)
}) 
```

The `runtime.features` registry will tell you all of the features available


```javascript
runtime.features.available
```

You can see which features have been enabled:

```javascript
runtime.enabledFeatures
```
