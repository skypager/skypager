# Skypager Example App: Sheets Server

[View Demo](https://sheets-server-example.skypager.io)

This example uses the `@skypager/helpers-server` and `@skypager/helpers-sheet` to create a REST API
that lets you discover some available google sheets, and get the data from those sheets as JSON.  

In addition, this project shows a simple React webapp that lets you browse the different sheets you have available and view the data in them.

This server depends on having a google cloud project and credentials for that project in the form of a service account JSON file that you need to download.

This isn't included in the project, so you need to have one.

## Requirements 

- You will need a service account JSON file that you download from Google Cloud for one of your projects.  
- This Google Cloud project needs to have enabled the google drive and google sheets APIs.
- You will need to share some spreadsheets with the email address found in your service account client_email property

## Installation and Usage

```shell
# install the dependencies
$ yarn 
# build the webapp
$ yarn build
# start the server
$ yarn start
```

## Supplying Secrets 

If you have the service account json, you can copy it into the secrets folder and we'll use that 

```shell
# this should be .gitignored, .npmignored, .dockerignored
$ mkdir -p secrets
# this file name is important it needs to be serviceAccount.json
$ copy /path/to/downloaded/serviceAccount.json secrets/serviceAccount.json
```

Or using environment variables, you can supply config this way

```shell
# this is what the node google client uses by default, assumes the file exists on disk
$ export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
$ export GCLOUD_PROJECT=your-project-id-from-the-service-account
```

Or if you prefer via to pass this information via CLI args to the start command

```shell
$ yarn start --service-account=/path/to/serviceAccount.json --google-project=your-project-id-from-the-service-account
```

## Deployment Example

When the service account file doesn't exist on disk, for example when deploying it to a cloud hosting provider 
such as now.sh, we can read the service account file via another environment variable.

**Now.sh Example*

```shell
# on your local machine
$ export SERVICE_ACCOUNT_DATA=`cat /path/to/serviceAccount.json`
# set the secret to the content of the service account json
$ now secrets add service-account "$SERVICE_ACCOUNT_DATA"
# deploy to now using the secret as an environment variable
$ now -e SERVICE_ACCOUNT_DATA=@service-account 
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
