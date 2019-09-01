# Feature

The Feature class is a type of [Helper](Helper.md) in that it defines a module type, or pattern.

Any module can provide an implementation of the Feature class if it conforms to the [Feature Provider Types](#provider-types)

A `Feature` is a module for a generic capability that can be provided by multiple, competing, and exclusive
providers.  (e.g. you either use AWS or Google Cloud for auth, not both at the same time.  Your app still benefits when it only needs to log in and log out without knowing about your boss's decision on which one to use.) 

Even in the case where there aren't multiple providers or integrations, the Feature can be used to represent some distinct set of functionality, or an API, that can be enabled optionally, at runtime.  A feature is something the application may be able to live without, (e.g. if speech recogintion engine is natively available, you want to load your voice control feature.  If it is not, maybe you use some external cloud service with an API key you don't hard code. Or just don't use it at all. 

Features generally require configuration, or settings.  For example, a database feature might want to talk to different databases using different URLs depending if the application is running in test, or production.  You generally don't want to version control these values, for security reasons, but also because the code needs to run in different environments and you rely on `process.env` or AWS secrets service.

You can also think of features as things that live behind a "feature flag".  (for example the way React runs differently if process.env.NODE_ENV == 'development' vs 'production)

- Features are easy to code split.  A database feature is generally the only thing that depends on the postgresql adapter from npm.
- Features can be checked for [support](#is-supported)
- Features can be [enabled](#enable) dynamically based on environment flags or application logic. 
- Features can notify when they are ready to be used
- Features generally only need to be enabled once
- Features can be optionally, or dynamically enabled, based on environment or process flags

## Main Purpose

The main purpose of Features are modules which can be loaded at runtime, to act as the service that provides important capabilities to your application.  Features can be things like authentication, authorization, speech recognition, email notifications, general concepts that can have a consistent API across the many different competing providers of these services.

```javascript
import Feature from '@skypager/feature' 

export class Authentication extends Feature {
  // runtime.feature('authentication').enable({ providerName: 'google|aws|auth0|whatever', config: process.env.AUTH_CONFIG })
  async featureWasEnabled({ providerName, config }) {
    await this.use(providerName, config)
  }

  /**
   * Using dynamic import here so we don't bundle google / aws at the same time
   */
  async use(providerName, config) {
    const cloudProvider = import(`@features/auth-${providerName}`)
    this.provider = cloudProvider(config)
  }

  /**
   * Let me know when i'm good
   */
  async login() {
    // google, aws, etc each do it slightly differently, we don't care
    await this.callMethod('login')
  }  

  async logout() {

  }

  get currentUser() {

  }
}
```

### Why "enable" a feature?

The process of `enabling` a feature gives you control (with your code, with your data) when certain code should be ran. (e.g. if you have features available for trial users vs fully paid users, or modules which should only be used by administrators)

The runtime has the ability to tell you which features are available, which are supported, and which features are already enabled.  At the time a feature is enabled, you can load third party libraries, connect to things, whatever.

## API

### Enable

```javascript
runtime.feature('speech-recognition').enable()
```

## Provider Types

A Feature provider module can either be a simple object of functions, or a subclass of Feature

Both are valid:

```javascript
import { types, Feature } from '@skypager/runtime'

export default VirtualMachine extends Feature {
  ref = (host) => {
    host.virtualMachine = this
  }

  static optionTypes = {
    platform: types.string.isRequired
  }
}
```

plain objects

```javascript
// import ourself
import * as vm from './vm.js' 

export function ref(runtime) {
  runtime.vm = this
}

export function attach(runtime, options) {
  // register this provider so it can be easily created by other features 
  runtime.features.register('vm', () => vm)

  // this plain module is now a stateful, observable entity
  const vmInstance = runtime.feature('vm', options)
}
```

These can be loaded into the runtime now

```javascript
import runtime from '@skypager/runtime'
import ClassBasedFeature from './class-based-example'
import ObjectBasedFeature from './object-based-example'

export default runtime
  .use(ClassBasedFeature)
  .use(ObjectBasedFeature)
```

And now when you distribute this runtime module, it will also have the additional features which you can turn on based on whatever logic you need.

### Feature Subclass

### Is Supported

### Feature Was Enabled

This hook will automatically be called after the feature is enabled.

as a function export

```javascript
export function featureWasEnabled() {

}
```

as a method on a subclass of Feature

```javascript
export class MyFeature extends Feature {
  featureWasEnabled() {

  }
}

export class MyAsyncFeature extends Feature {
  async featureWasEnabled() {

  }  
}
```
