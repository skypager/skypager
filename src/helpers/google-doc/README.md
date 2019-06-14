# Google Docs Helper

Provides a model for working with google documents.

[Learn about their structure](https://developers.google.com/docs/api/concepts/structure)

This can be used to turn google documents into markdown, or to treat google documents as a content database for a CMS. 

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

You'll also need to enable the Google Drive Google and Google Docs APIs.  

In the Google Cloud Console, under `APIs and Services` choose `Library` (e.g. `https://console.cloud.google.com/apis/library?project=your-project-id`)

### Share Your Docs 

With the server to server auth set up, the last step is to share the documents you want to load with the service account client email you'll be using to access them.

You can find the email address in `client_id` property of the service account json

## Usage

Until I get better acquainted with the underlying google apis this library uses, the service account has to be saved to disk.

```javascript
const runtime = require('@skypager/node')
const GoogleDocHelper = require('@skypager/helpers-google-doc')

const pathToServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/path/to/service-account.json'
const serviceAccount = require(pathToServiceAccount)
const googleProject = process.env.GCLOUD_PROJECT || serviceAccount.project_id

// this creates runtime.googleDocs and runtime.googleDoc 
runtime.use(GoogleDocHelper, {
  serviceAccount: pathToServiceAccount,
  googleProject
})

main()

async function main() {
  await runtime.googleDocs.discover({ includeTeamDrives: true })

  const firstAvailable = runtime.googleDocs.available[0]
  const googleDoc = runtime.googleDoc(firstAvailable)

  await googleDoc.load()

  const { 
    // the title of your doc
    title,
    // all of the content nodes 
    contentNodes = [],
    // all the heading nodes
    headingNodes = [],
    // all the paragraph nodes
    paragraphNodes = [], 
    // all the lists
    lists = [], 
    // all the tables
    tables = [] ,
    // all of the styles (e.g. heading 1, heading 2)
    namedStyles = {}
  } = googleDoc

  console.log({ 
    title, 
    namedStyles,
    contentNodes: contentNodes.length, 
    headingNodes: headingNodes.length, 
    lists: lists.length,
    namedStyles: Object.keys(namedStyles).length
  })
}
```