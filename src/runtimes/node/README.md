# Skypager Node Runtime

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
