# Runtime

The Skypager Runtime is a module you can import or require, which provides you with a global singleton instance called `skypager` 

This object lives for the life of a process, and uses the module cache to ensure it is a unique and consistent singleton that every module can access.

The `runtime` provides us with a global event bus, a dependency injection container, and a system of registries and factory functions that can create instances
of Helper classes that represent any uniquely named module or objects.  

Think of all the folders that live 2 levels deep that are plural names.  Pages, Components, Servers, Endpoints, Models, Layouts.

- A folder called `sheets` may have a half dozen module files underneath it.

- A module in the `sheets` folder only needs to export a `sheetId` string, to be able to be represented by a `GoogleSheet` class at runtime. The `GoogleSheet` class defines everything
all google sheets have in common.  Once it is created and knows the `sheetId`, it can discover what is unique about that particular instance, what is its state? what are the worksheets? what are the column headings? Once the object knows all this, it can provide a javascript API for working with it in code. 

- Once attached, the `GoogleSheet` Helpeer creates a registry of available instances at `runtime.sheets` and a function that lets you activate any given instance at `runtime.sheet`

- Similarly, a folder called `documents` might have a half dozen or more module files underneath it.  A module exports a `documentId` string so it can be represented by a `GoogleDoc` class.  
The `GoogleDoc` class defines everything all google documents have in common.  Once it knows the `documentId` it can discover what is unique about that particular instance, 
and provide a javascript API for working with it.

- Once attached, the `GoogleDoc` creates a registry of available instances at `runtime.googleDocs` and a function that lets you activate any given instance at `runtime.googleDoc`

- A module that exports a `start` and `stop` function could be represented by a `Server` class. The `runtime` will start and stop whatever
you tell it, and provide consistent lifecycle hooks for you to tap into and customize the server's behavior before it starts.

Regardless of the type, all `Helpers` combine a `provider` which is generally any javascript object that can be saved to disk and version controlled,
with `options` or props, which are values that can generally only be known at runtime based on the environment, how the process was started, or what the user has done in the app.

## Registries

Any Helper that attaches to the runtime, will have a registry of modules that the runtime can know about in advance.  Again, these are referred to as `providers` and they are the types of
JavaScript objects that can be saved to disk.  (Source code modules, JSON, or anything Webpack can generate.)

Each module in a specific registry, is backed by the specific Helper class.  Each instance can have its own `state`, and emit events.

```javascript
runtime.use(require('@skypager/helpers-server')) // Server.attach(runtime)

// this is the `provider` module.  you can spawn as many instances, on their own port, as you want.
runtime.servers.register('app', () => ({
  appWillMount(app) {
    app.get('/hello', (req, res) => res.send('world'))
  }
}))

const options = {
  port: 5000,
  history: true,
  cors: true,
  serveStatic: true
}

const server = runtime.server('app', options) // => instance of Server

server.start().then(() => {
  console.log(`Server listening on ${server.port}`)
})
```

## The Google Helpers provide JavaScript modules backed by Google Document state

Imagine this module.  You have your e-commerce spreadsheet, it has a products worksheet and a transactions worksheet.

you know its id, you export a function that lets you add data to it, another function that generates a report from it,
and lets say a function to send an email to the supplier when you need to reorder.

```javascript
export const sheetId = 'unique-sheet-id'

export function getBestSellers() {
  const { sum } = this.lodash

  const productsBySku = this.chain.get('data.products').keyBy('sku').value()

  return this.chain
    .get('data.transactions')
    .groupBy('sku')
    .mapValues((salesOfSku) => salesOfSku.length)
    .entries()
    .sortBy(e => e[1])
    .slice(0, 10)
    .map((sku) => productsBySku[sku])
}

export async function addProduct({ title, vendor, sku, price, stockCount }) {
  const products = await this.ws('products')
  await products.addRow({ title, vendor, stockCount })
}

export async function reorderFromVendor(sku) {
  const product = this.data.find(product => product.sku === sku)

  if (product) {
    this.runtime.sendEmailTo(vendor)
  }
}
```

This is a contrived example, since a true excel wizard might use formulas for things like `getBestSellers`, and spare you from
having to implement the same logic in JavaScript.  Every Spreadsheet is different, what our goal is is to provide a class that makes
working with each of them in JavaScript as easy as can be.

Anyway, Let's say you had 10 different e-commerce sites, each with their own product databases.

You could define the interface once, as its own module.  And then write a function which can be used to create an instance of 
one specific e-commerce project's data, with the common re-usable interface you can share among all of your other e-commerce projects.

```javascript
import { getBestSellers, addProduct, reorderFromVendor } from './sheet-types/e-commerce'

async function loadProductSheet({ name, sheetId }) {
  return runtime.sheet(name, {
    sheetId,
    addProduct
  })
}
```

Now lets say you wanted to run a script all day long which fired off emails any time a new transaction was recorded in the sheet.

You could implement this as a cloud function, which read from the sheet and wrote back to it.  

Or you can just write a script and run it on your own computer of VPS.

## Summary

This was a brief summary of how the Skypager Runtime is used as a hub for working with collections of different modules that are partially saved to disk,
and and combined with snapshots of state that exist in the Google Drive APIs at runtime. 

This describes a general structure for projects which use the different Google Helpers.

The `@skypager/node` runtime has adapters for many other systems such as the file system, the child process spawner, git integration, and other useful features.

You can combine any of them to build servers or scripts powered by content that your team works on in Google Drive.





