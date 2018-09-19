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

```javascript
async () => {
  await runtime.sheets.discover({ sharedWithMe: true })

  runtime.sheets.available // will be the camelCased title of each spreadsheet

  const users = runtime.sheet('myUsersSheet')

  await users.loadAll() 
}
```

## Internals

Internally, this library uses the [Node Google Spreadsheet](https://github.com/theoephraim/node-google-spreadsheet) library, as well as the official googleapis
