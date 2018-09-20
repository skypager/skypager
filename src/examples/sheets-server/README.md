# Example

This example uses the `@skypager/helpers-server` and `@skypager/helpers-sheet` to create a REST API
that lets you discover some available google sheets, and get the data from those sheets as JSON.  

Using `@skypager/helpers-client` we create a functional wrapper for making these REST calls without thinking about 
the networking piece.

## Requirements 

- You will need a service account JSON file that you download from Google Cloud for one of your projects.  
- This Google Cloud project needs to have enabled the google drive and google sheets APIs.
- You will need to share some spreadsheets with the email address found in your service account client_email property

## Getting Started

If you have the service account json, you can copy it into the secrets folder and we'll automatically find it

```shell
$ mkdir -p secrets
$ copy /path/to/serviceAccount.json secrets/serviceAccount.json
```

Or if you prefer to supply the location to your service account credentials via an environment variable 

```shell
$ export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
$ export GCLOUD_PROJECT=your-project-id-from-the-service-account
$ yarn start
```

Or if you prefer via CLI args

```shell
$ yarn start --service-account=/path/to/serviceAccount.json --google-project=your-project-id-from-the-service-account
```

## REST API

- **GET** `/sheets` - returns a list of sheet objects to work with
- **GET** `/sheets/:spreadsheetKey` - returns all of the data for a given sheet object.  the data will be keyed by worksheet, and contain an array of row objects whose keys are the column names of the sheet
- **GET** `/sheets/:spreadsheetKey/:worksheetKey` - returns all of the data for a given worksheet. the data will be an array of row objects whose keys are the column names of the sheet

## REST Client

```javascript
const runtime = require('@skypager/web').use('./client.js')
const sheetsClient = runtime.client('app')
```

- **listSheets()** returns an array of sheet objects
- **showFullSheet()** returns all sheet data
- **showWorksheet()** returns one worksheet from the google sheet as JSON
