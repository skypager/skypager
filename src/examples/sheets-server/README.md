# Example

This example uses the `@skypager/helpers-server` and `@skypager/helpers-sheet` to create a REST API
that lets you discover some available google sheets, and get the data from those sheets as JSON.

## Getting Started 

You will need a service account JSON file that you download from Google Cloud for one of your projects.  

This Google Cloud project needs to have enabled the google drive and google sheets APIs.

Once you have this file, you can put it in the secrets folder which is the default location

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
