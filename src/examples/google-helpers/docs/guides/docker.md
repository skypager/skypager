# Deploying w/ Docker 

Deploying a server which uses the various Google Drive helpers using Docker is fairly straightforward compared to using any node.js server with Docker.

Any complexity usually relates to how we get the Google Cloud Service Account injected into our deployment in a secure way.  (You don't want to include this in a public docker image, or version control it.)

## Using our base container 

Part of the @skypager distribution includes docker images which can be supplied secrets and configuration and "just work".

You can volume mount your own project code, or copy it into the docker image, and not need to worry about any dependencies or anything.

```Dockerfile
FROM node:12.4
WORKDIR /app
RUN npm init --yes 
CMD 
```

## Building your own container

In your container, make sure to install the dependencies from npm, if they're not in your package.json

```Dockerfile
RUN npm install @skypager/node @skypager/helpers-sheet @skypager/helpers-google-doc
```

And make sure your container accepts the environment variable, and that you save the contents of that environment variable
to `$cwd/secrets/serviceAccount.json`

```Dockerfile
ENV SERVICE_ACCOUNT_DATA ''
RUN mkdir /app/secrets
RUN echo $SERVICE_ACCOUNT_DATA > /app/secrets/serviceAccount.json
```

And then somewhere in your entry script

```javascript
const runtime = require('@skypager/node')
const serviceAccount = runtime.resolve('secrets', 'serviceAccount.json')

const googleOptions = {
  serviceAccount,
  googleProject: require(serviceAccount).project_id
}

runtime
  .use(require('@skypager/helpers-sheet'), googleOptions)
  .use(require('@skypager/helpers-google-doc'), googleOptions)
```

Wherever you start this container, just make sure you copy and paste the serviceAccount JSON into the SERVICE_ACCOUNT_DATA environment secret.