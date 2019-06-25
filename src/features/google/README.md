# Google Integration 


## Installation

To use this library in your own project, make sure to install it

**Via NPM**

```shell
npm install @skypager/node @skypager/google --save
```

**Via YARN**

```shell
yarn add @skypager/node @skypager/google --save
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

### Share Your Sheets, Documents, Folders, etc

With the server to server auth set up, the last step is to share the sheets you want to load with the service account client email you'll be using to access them.

You can find the email address in `client_id` property of the service account json


## Usage

The following code will enable the google integration on the skypager runtime

```javascript
const runtime = require('@skypager/node')
const GoogleIntegration = require('@skypager/google')

runtime.use(GoogleIntegration, {
  // or process.env.GOOGLE_APPLICATION_CREDENTIALS
  serviceAccount: '/path/to/service.json'
  // or process.env.GCLOUD_PROJECT or read from the service account project_id
  googleProject: 'google-cloud-project'
})
```

You can now access `runtime.google` to interact with the integration.

## API

### listFolders

Returns all of the folders from the Drive Files list API.

### listFiles

Returns all of the files from the Drive Files list API.

### listDocuments

Returns all of the google docs files from the Drive Files list API.

### listSpreadsheets

Returns all of the google sheets files from the Drive Files list API.

### service

Provides you with an arbitrary google API rest Client.  Your account must have this API enabled for it to work.

