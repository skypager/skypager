---
menu:
  order: 0
  icon: rocket
---

# Introduction 

The Google Helpers make it possible to treat google documents as JavaScript modules.

You can connect to a Google Spreadsheet in a node server process, and use it to generate a static website, ( say one page per row in the sheet ) and deploy that to a CDN.

You can also expose a REST API which lets you read, write, update, and query all of the worksheets as if they were named REST services, and deploy that somewhere like [now by zeit.co](https://zeit.co) 

You can work with Google Documents and treat each one as a blog post or an article.  You can generate a feed of all of your latests posts, 
using Google Documents as your underlying editor.

## Skypager Runtime

The [Google Sheet Helper](api/GoogleSheet.md) and the [Google Document Helper](api/GoogleDoc.md) are both implemented as Helper classes,
which are provided by the [@skypager/runtime](runtime.md) library.  A Helper class can represent any uniquely named JavaScript object,
like a module you can require, as an entity like object that can have state, emit events, and relate to other instances.  

The Runtime is responsible for keeping track of these modules, and making it easy for you to create instances of them by name when you need them.

This pattern allows us to save the minimum amount we know about a spreadsheet, or a google document, as a module in our project.

```javascript
export const sheetId = 'unique-id-from-the-url'
```

And then the `runtime` module singleton is aware of these modules, activates them on demand, and helps maintain their state for the lifecycle
of your program.

The `runtime` module can be extended with a chainable use API.  The different Google helpers are implemented as extensions which use this API.

```javascript
runtime.use({
  attach(runtime) {
    // extend away  
  }
})
```

Which is how we load the google helpers and configure them with what they need. 

```javascript
const runtime = require('@skypager/node')
const serviceAccount = runtime.resolve('secrets', 'serviceAccount.json')
runtime.use(
  require('@skypager/helpers-sheet'), {
    serviceAccount,
    googleProject: require(serviceAccount).project_id
  }
)
```

In doing this, the Sheet Helper attaches itself to the runtime.  It defines a `runtime.sheet` function and a `runtime.sheets` helper registry.

If you've ever written an Express.js Server, think of the helper registry as being similar to how you declare API endpoint handlers.

You're combining a unique string, with an anonymous module or function, and giving it a unique purpose in the overall behavior of your API.

You might have one endpoint, or a hundred, they all work together.  The express server, or runtime, coordinates this all, for as long as the node.js process runs.

When we've extended the runtime with the Google Sheet Helper, we can now tell the sheets registry what is available.

```javascript
runtime.sheets.register('my-sheet', () => ({
  sheetId: 'unique-key-from-url'
}))
```

Or we can discover what's available by querying the google drive files API.

```javascript
runtime.sheets.disover().then(() => {
  console.log(runtime.sheets.available)
})
```