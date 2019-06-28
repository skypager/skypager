# Google Integration 

The Google Feature provides an interface to the google apis node.js SDK.

It makes it easy to browse files and folders, documents, spreadsheets, and calendars,
either on behalf of a service account user (who users can share files with), or on behalf
of actual users with an oauth2 application setup with the appropriate APIs enabled.

It provides a CLI tool for doing many of the things you can do with the feature's JavaScript API 

## Installation

To use this library in your own project, make sure to install it

**Via NPM**

```shell
npm install @skypager/node @skypager/google @skypager/cli --save
```

**Via YARN**

```shell
yarn add @skypager/node @skypager/google @skypager/cli --save
```

## Required Setup

You'll need

1) a Service Account JSON (best to store it in `$projectRoot/secrets/serviceAccount.json`)
2) The Google Drive, Google Sheets, Google Documents, and possibly Google Calendar APIs
3) Google Sheets or Documents shared with the `client_email` from the service account (if not using oauth)

**optional**

4) oAuth2 Credentials JSON (a json with the key installed that has client_id, client_secret ) (best to store in `$projectRoot/secrets/clientCredentials.json`)
5) a user who authorizes the application to access their account (which you can do with `skypager google authorize`)

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

### Share Your Sheets, Documents, Folders, etc

With the server to server auth set up, the last step is to share the sheets you want to load with the service account client email you'll be using to access them.

You can find the email address in `client_id` property of the service account json.

If you do go with the oauth2 credentials setup, you can also access your own documents.


## Usage

The following code will enable the google integration on the skypager runtime

```javascript
const runtime = require('@skypager/node')
const GoogleIntegration = require('@skypager/google')

runtime.use(GoogleIntegration, {
  // if you want to use oauth to talk to google on behalf of real users
  credentials: '/path/to/client-credentials.json',
  // or process.env.GOOGLE_APPLICATION_CREDENTIALS
  serviceAccount: '/path/to/service.json'
  // or process.env.GCLOUD_PROJECT or read from the service account project_id
  googleProject: 'google-cloud-project'
})
```

You can now access `runtime.google` to interact with the integration.

## CLI

When you install `@skypager/google` the modules provides the [google script](scripts/google.js) which is a
hierarchal command application for performing actions with the various APIS provided by the google integration

Running the following will show the available help subjects

```shell
$ skypager google
```

If you wish to make calls e.g. to the calendars API, or any API on behalf of a real user instead of the service account
email that you can share google files and things with, then you will need to setup an oauth2 client and save the credentials
in e.g `secrets/clientCredentials.json`.  

You can then authorize access with the following command, which will open a web browser and ask you to paste the resulting code.

```shell
$ skypager google authorize
```

Once authorized, or with your service account credentials, you can run commands such as

```shell
$ skypager google calendars list
$ skypager google sheets list
$ skypager google sheets dump my-ecommerce-sheet --output-path=backups/ecommerce.json 
$ skypager google sheets create "Your Sheet Title" 
  --worksheet="products: title, sku, manufacturer, cost, shippingCost, quantityOnHand" 
  --worksheet="inventory: sku, warehouseId, locationId, quantityOnHand"
```

Passing the `--server` flag will prefer the service account auth over user specific oauth.

To get help with any command

```shell
$ skypager google help authorize 
$ skypager google help docs
$ skypager google help sheets 
$ skypager google help files 
$ skypager google help calendars 
$ skypager google help folders 
```

get help with subcommands

```shell
$ skypager google docs list help
# or
$ skypager google docs list --help
```

## API

Generally you only need a single instance of the google integration, so it is available off of the runtime
once it is enabled as a feature.

```javascript
const runtime = require('@skypager/node')
  .use(require('@skypager/google'))

const { 
  /* @type { import("./src/GoogleIntegration").GoogleIntegration } */
  google 
} = runtime

google.whenReady().then(() => {
  console.log('google server to server auth ready')
})
```

### listFolders

Returns all of the folders from the Drive Files list API.

```javascript
google.listFolders({ includeTeamDrives: true }).then((folders) => {
  console.log(folders)
})
```

### listFiles

Returns all of the files from the Drive Files list API.

```javascript
google.listFiles({ sharedWithMe: true, includeTeamDrives: true }).then((files) => {
  console.log(files)
})
```

### listDocuments

Returns all of the google docs files from the Drive Files list API.

```javascript
google.listDocuments({ sharedWithMe: true, includeTeamDrives: true })
.then((documents) => {
  console.log(documents)
})
```

each result has a `getDocument` function, which will fetch that particular document from the google documents rest api

### listSpreadsheets

Returns all of the google sheets files from the Drive Files list API, formatted in a way that they can be used as providers for
the `@skypager/helpers-sheet` class.

each result has a `getDriveFile` function which will fetch the drive file record.

```javascript
const runtime = require('@skypager/node').use(require('@skypager/helpers-sheet'))

google
.listSpreadsheets({ sharedWithMe: true, includeTeamDrives: true })
.then((sheets) => {
  // now you can create instances of the GoogleSheet helper from this data.
  sheets.forEach((sheet) => {
    runtime.sheets.register(sheet.title, () => sheet)
  })
})
```

### service

Provides you with an arbitrary google API rest Client.  Your account must have this API enabled for it to work.

```javascript
google.service('calendar', { version: 'v3', auth: google.oauthClient })
```

### createOAuthClient

Creates an oauth2 client, capable of making calls on behalf of real google users instead of service account users.

### createAuthClient

Creates the server to server auth client that you need to pass to the google node.js sdks

