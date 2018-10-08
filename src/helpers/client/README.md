# Skypager Client Helper

The Client Helper is used to provide a functional interface on top of an axios REST API Client.

The functional interface is intended to provide a more fluent system for interacting with a REST API, 
which hides the fact that we are interacting with an API over the network at all.

The client helper is automatically bundled with the [Skypager Node Runtime](../../runtimes/node) as well as with the [Skypager Web Runtime](../../runtimes/web)

## Example Usage

```javascript
// runtime.js
const runtime = require('@skypager/runtime')
const ClientHelper = require('@skypager/helpers-client')

runtime.onRegister('clients', () => {
  runtime.clients.register('sheets', () => require('./client.js'))
})

runtime.use(ClientHelper)

const sheetsClient = runtime.client('sheets')
```

In the above example, we're registering a sheets client helper and creating an instance of it.

This file might look something like:

```javascript
export const interfaceMethods = [
  'listSheets',
  'showFullSheet',
  'showWorksheet',
  'showSheetMetadata',
]

export function listSheets(query = {}) {
  return this.client.get(`/sheets`, { query }).then(r => r.data)
}

export function showFullSheet(sheetKey, query = {}) {
  return this.client.get(`/sheets/${sheetKey}`, { query }).then(r => r.data)
}

export function showSheetMetadata(sheetKey, query = {}) {
  return this.client.get(`/sheets-meta/${sheetKey}`, { query }).then(r => r.data)
}

export function showWorksheet(sheetKey, worksheetKey, query = {}) {
  return this.client.get(`/sheets/${sheetKey}/worksheetKey`, { query }).then(r => r.data)
}
```

Using `sheetsClient` might look like:

```javascript
const runtime = require('./runtime.js')

async function main() {
  const client = runtime.clients('sheets')
  const sheets = await client.listSheets() 
  const sheetInfo = await client.showSheetMetadata().then(response => response.info)
}

main()
```

In the above code block, you'll notice the client has no idea about the underlying REST API.

This is useful in a large application, as the application can be built against a standard interface for loading information
and that implementation is free to change however it wants to so long as it maintains compatability.  It is also useful if you wanted to,
for example, buid a completely offline mock version to be used in testing.

## Helper Specification

The following names refer to values exported from a client helper instance module.

- **baseUrl** or **baseURL** - defines the base url the axios client will talk to

- **createClient** - used to create the underlying client communication gateway, usually an instance of the axios adapter

- **interfaceMethods** the Client Helper can export an array of names for functions the client helper module exports.  

  In the example above, we have `showWorksheet`, `listSheets`, and `showSheetMetadata`, each of which is a function.  This function
  will be bound to the instance of the client helper.


## Advanced Usage

Given the architecture of the Client Helper, it can be used to generate a completely functional interface for an API using something like 
a Swagger Specification.   

```javascript
const swagger = require('./swagger-definition.json')

const interfaceMethods = getOperationNames(swagger)

const interfaceFunctions = createFunctionsFrom(swagger) 

module.exports = Object.assign({
  { interfaceMethods },
  interfaceFunctions
})

function getOperationNames(swaggerDefinition) {
  // swagger definitions will have a bunch of requests defined,
  // each has a url, method, and parameters
  return listOfFunctionNamesFoundIn(swaggerDefinition)
}

function createFunctionsFrom(swaggerDefinition) {
  const objectOfFunctions = {}
  // for each request defined in swagger, use the url, parameters, and method
  // to construct a call to axios.  wrap that in a function, and return it 
  return objectOfFunctions
}

```



