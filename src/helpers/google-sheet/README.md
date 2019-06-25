# Google Sheets Helper

The Google Sheets Helper is an extension for the Skypager Node Runtime which lets you treat google sheet documents as modules.

An instance of the Sheet Helper can be used in scripts, or node.js servers, to read and write from that spreadsheet in real time.

- You can add, delete, or modify the worksheets in a google spreadsheet.
- You can add, delete, or modify rows in a worksheet.
- Each worksheet represents its data as objects.  The keys to this object correspond to the values of the columns in Row 1.  Aka your headers.
- You can define classes which represent each row in a worksheet.  The default [RowEntity](src/RowEntity.js) class has getters and setters for each column attribute.

For example, this google sheet [https://docs.google.com/spreadsheets/d/1w5LZe7wXL59S2NhafvbQXudFpdVI3Z0NVwBMrexQvXQ/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1w5LZe7wXL59S2NhafvbQXudFpdVI3Z0NVwBMrexQvXQ/edit?usp=sharing)

![example.png](example.png)

- has a worksheet 'sheet1'
- which has column headers `["column-one","column-two","column-three","column-four","column-five"]` 
- has data in rows 2, 5

it produces the following data

```javascript
const data = {
  sheet1: [{
    columnOne: "row one column one",
    columnTwo: "row one column two",
    columnThree: "row one column three",
    columnFour: "row one column four",
    columnFive: "row one column five"
  }, /* ... */]
}
```



## Installation

To use this library in your own project, make sure to install it

**Via NPM**

```shell
npm install @skypager/node @skypager/helpers-sheet --save
```

**Via YARN**

```shell
yarn add @skypager/node @skypager/helpers-sheet --save
```

## Required Setup

You'll need

1) a Service Account JSON
2) The Google Drive and Google Sheets APIs
3) Google Sheets shared with the `client_email` from the service account.

### Server to Server Auth

Using this module requires using interacting with Google APIs using their server to server auth method, which is powered by Service Account credentials.

A Service Account credential looks like:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "some-random-email@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-project-id.iam.gserviceaccount.com"
}
```

You can manage your Service Accounts by going to the [Google Cloud Console](https://console.cloud.google.com/) and creating a project or selecting the one you want to work with.

Once you are there, under the `IAM & admin` section you can click on `Service Accounts`. (e.g. `https://console.cloud.google.com/iam-admin/serviceaccounts?project=your-project-id`)

Create a service account, and download the JSON to `secrets/serviceAccount.json`, or some other path.

You'll use this service account when activating the helper, as you'll see in [USAGE](#usage).

### Enable Google APIs

You'll also need to enable the Google Drive and Google Sheets APIs.  

In the Google Cloud Console, under `APIs and Services` choose `Library` (e.g. `https://console.cloud.google.com/apis/library?project=your-project-id`)

### Share Your Sheets

With the server to server auth set up, the last step is to share the sheets you want to load with the service account client email you'll be using to access them.

You can find the email address in `client_id` property of the service account json


## Usage

Doing the following will create a registry of available sheet helpers at `runtime.sheets`

```javascript
const runtime = require('@skypager/node')
const SheetHelper = require('@skypager/helpers-sheet')

runtime.use(SheetHelper, {
  // or process.env.GOOGLE_APPLICATION_CREDENTIALS
  serviceAccount: '/path/to/service.json'
  // or process.env.GCLOUD_PROJECT or read from the service account project_id
  googleProject: 'google-cloud-project'
})
```

A sheet helper can be created from a module in your project. A valid sheet helper module is any module that
exports a `sheetId` string which refers to the id found in the URL to the spreadsheet

- https://docs.google.com/spreadsheets/d/`$THIS-IS-THE-ID`/edit#gid=something

```javascript
// my-users-sheet.js
export const sheetId = '$your-google-drive-sheet-id'
```

To be able to turn this module into a `GoogleSheet` instance, we register it: 

```javascript
import * as MyUsersSheet from './my-users-sheet'

runtime.sheets.register('users', () => MyUsersSheet)
```

And activate it when we need it 

```javascript
const sheet = runtime.sheet('users')

// will return objects for each row.
// keys are the header column, value is the cell for that row / column 
sheet.loadAll().then((keyedByWorksheetName) => {
  const { users = [], companies = [], whatever = [] } = keyedByWorksheetName
  console.log(users[0]) // { name: "Jon Soeder", job: "player coach captain", email: "jon@jmoney.com" }
})
```

## Automatically Discovering Spreadsheets via Google Drive API

If you don't need to build a module for your sheet (you just want the data), you can skip registering modules by just remotely discovering sheets available to you.

```javascript
async () => {
  await runtime.sheets.discover({ sharedWithMe: true, teamDrives: true })

  runtime.sheets.available // will be the camelCased title of each spreadsheet

  const users = runtime.sheet('myUsersSheet')

  await users.loadAll() 
}
```

## Building an interface for working with your sheet

When you write a module for the SheetHelper to wrap, you can export functions to make working
with the sheet data more user friendly

```javascript
export const sheetId = 'my-users-spreadsheet-id'

// will automatically call loadAll() and cache it on this.data when the helper instance initializes
export const eagerLoaded = true

export function getKeyedById() {
  return this.lodash.keyBy(this.data, 'id')
}

export function getGroupedByRole() {
  return this.lodash.groupBy(this.data, 'role') 
}

export async function addUser(userData = {}) {
  await this.spreadsheet.addRow(
    this.spreadsheet.worksheets[0].id,
    Object.values(userData)
  )
}
```

Now when you work with this sheet helper instance, these will be available as properties

```javascript
const users = runtime.sheet('users')

async function main() {
  await users.whenReady()
  const { groupedByRole, keyedById } = users

  await users.addUser({ name: 'Jon Soeder', role: 'Baller', id: 'soederpop' })
  // do something
}
```

## Row Level Entities

The spreadsheet helper can load all of the data as plain old javascript objects.  

Your column headers in row one determine the attributes, and all of the rows 2 and above get turned into objects with properties that match the column names.

You can also work with each row as an entity, using the Active Record pattern.

By default, each entity is an instance of the [RowEntity](src/RowEntity.js) class, which is just an object that has getters and setters for each of the attributes.  Setting the value actually writes the value to the cell in google spreadsheets.

You can define a custom `RowEntity` class for an individual worksheet.

In the example below, you have a google spreadsheet that has a worksheet titled `users`.  

This worksheet includes two columns, firstName, lastName.

We can define a User entity that lets us define a computed property `fullName`

```javascript
const googleSpreadsheet = runtime.sheet('master-users-list')

class User extends googleSpreadsheet.RowEntity {
  set fullName(value) {
    const parts = value.split(" ")

    this.firstName = parts.shift()
    this.lastName = parts.join(" ")

    return value
  }

  get fullName() {
    return this.firstName + ' ' + this.lastName
  }
}

googleSpreadsheet.registerEntity('users', () => User)

async function main() {
  const users = googleSpreadsheet.sheet('users')
  await users.indexCells()

  const user = users.entities[0]
  console.log('User full name' + user.fullName)
}

main()
```

## Sheets as Modules

The above examples show how to use this module.  

A very common scenario is you have a project, and there are a few special spreadsheets that everyone references.

In this scenario, you don't need to discover sheets, you will know their id's ahead of time.  

Maybe you have a products sheet, one you use in development, and one that is used "in production".

If all you need is the data, then the examples you've seen so far will work well.

If you want to build a more complex system on top of the google sheets (say you have multiple google sheets) then the following setup is something you can build on.

- `scripts`
  - `reorder-all.js`
  - `generate-website.js`
- `src/`
  - `sheets/`
    - `products.js`
    - `inventory.js`
    - `promotions.js`
  - `runtime.js`

Your products.js is for your products sheet, which has a products worksheet that has a SKU column.

We hard code the sheet id, and define an `initialize` hook which we use to associate a `Product` class
with every row in the sheet's products worksehet.

```javascript
export const sheetId = 'sheet-id-for-your-products-sheet'

export const eagerLoaded = true

export async function initialize() {
  const sheet = this

  class Product extends sheet.RowEntity {
    get stockSheet() {
      return this.runtime.sheet('inventory')
    }

    get promotionsSheet() {
      return this.runtime.sheet('promotions')  
    }

    get promotions() {
      return this.promotionsSheet.products.filter(({ sku }) => sku === this.sku)
    }

    get inventory() {
      return this.stockSheet.inventory.filter(({ sku }) => sku === this.sku)      
    }

    get inStock() {
      return !!inventory.find(({ onHand }) => onHand > 0)
    }  
  }
}
```

We do something similar for both `inventory.js` and `promotions.js`

```javascript
// inventory.js
export const sheetId = 'your-inventory-sheet-id'

export const eagerLoaded = true

export async function initialize() {
  const { RowEntity } = this  

  class Stock extends RowEntity {
    async reorder() {
      const { sku, supplierEmail } = this
      await this.runtime.emailer.send(supplierEmail, {
        subject: `Re-order for ${sku}`,
        message: 'yo resupply me'
      })
    }
  }

  this.registerEntity('stock', () => Stock)
}
```

Promotions keeps track of promotion codes by product sku

```javascript
// promotions.js
export const sheetId = 'your-promotions-sheet-id'

export const eagerLoaded = true

export async function initialize() {
  const { RowEntity } = this  

  class Promotion extends RowEntity {
    get stockSheet() {
      return this.runtime.sheet('inventory')
    }

    get inventory() {
      return this.stockSheet.filter(({ sku }) => sku === this.sku)
    }

    // a promotion is only valid while we have enough stock, for example
    get isStillValid() {
      return !!inventory.find(({ onHand }) => onHand > this.minimumStockLevel)
    }
  }

  this.registerEntity('promotions', () => Promotion)
}
```

So three separate google docs are combined in this example, each one is represented by a module.

Each module defines different classes to represent the data found in each row of their named worksheets.

So we can register them with the sheets registry and use them all together, in a file called `runtime.js`  

```javascript
const runtime = require('@skypager/node')
const SheetHelper = require('@skypager/helpers-sheet')

runtime.use(SheetHelper, {
  // or process.env.GOOGLE_APPLICATION_CREDENTIALS
  serviceAccount: '/path/to/service.json'
  // or process.env.GCLOUD_PROJECT or read from the service account project_id
  googleProject: 'google-cloud-project'
}).use((next) => {
  runtime.sheets.register('products', () => require('./sheets/products.js'))
  runtime.sheets.register('inventory', () => require('./sheets/inventory.js'))
  runtime.sheets.register('promotions', () => require('./sheets/promotions.js'))

  Promise.all([
    runtime.sheets.allInstances().map((sheet) => sheet.whenReady())
  ]).then(() => next()).catch((error) => next(error))
})


```

Now in this hypothetical example, there are two scripts. `reorder-all.js` and `generate-website.js`

The `reorder-all` script can be run weekly, to resupply all the items you're low on.

The `generate-website` script can be run whenever the inventory, products, or promotions sheets change.

both of them would only need to include your `runtime.js` module

```javascript
import runtime from '../src/runtime'

async function main() {
  await runtime.start()
  const inventory = runtime.sheet('inventory')

  const stockLevels = inventory.ws('stock')

  for(stock of stockLevels) {
    if (stock.onHand < stock.reorderPoint) {
      await stock.reorder()
    }
  }
}
```

and can be executed by running the scripts

```shell
$ skypager reorder-all --esm
$ skypager generate-website --esm
```

## Internals

Internally, this library uses the [Node Google Spreadsheet](https://github.com/theoephraim/node-google-spreadsheet) library, as well as the official googleapis
