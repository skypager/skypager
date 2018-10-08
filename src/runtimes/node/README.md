# Skypager Node Runtime

This provides a version of the skypager runtime specially tailored for use in a node.js server environment.

## Installation and Usage

```shell
$ yarn add @skypager/node --save
```

## Using in a script

```javascript
const runtime = require('@skypager/node')

runtime.start().then(() => {
  runtime.log(`Oh! World.`)
})
```
