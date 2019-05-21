# Google Sheets Helper

## Usage

Doing the following will create a registry of available sheet helpers at `runtime.sheets`

```javascript
import runtime from '@skypager/node'
import * as SheetHelper from '@skypager/helpers-sheet'

runtime.use(SheetHelper, {
  // or process.env.GOOGLE_APPLICATION_CREDENTIALS
  serviceAccount: '/path/to/service.json'
  // or process.env.GCLOUD_PROJECT or read from the service account project_id
  googleProject: 'google-cloud-project'
})
```

You can register any sheet modules found in your project

```javascript
import * as MyUsersSheet from './my-users-sheet'

runtime.sheets.register('users', () => MyUsersSheet)
```

a sheet module only requires one export, a string

```
export const sheetId = '$your-google-drive-sheet-id'
```

You can then work with the google spreadsheet as if it were an entity

```javascript
const sheet = runtime.sheet('users')

// will return objects for each row.
// keys are the header column, value is the cell for that row / column 
sheet.loadAll().then((keyedByWorksheetName) => {

})
```

## Automatically Discovering Spreadsheets via Google Drive API

If you don't need to build a module for your sheet (you just want the data), you can skip registering modules by just remotely discovering sheets available to

```javascript
async () => {
  await runtime.sheets.discover({ sharedWithMe: true })

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

## Internals

Internally, this library uses the [Node Google Spreadsheet](https://github.com/theoephraim/node-google-spreadsheet) library, as well as the official googleapis
