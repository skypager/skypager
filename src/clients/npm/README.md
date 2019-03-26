# NPM Repository Client 

An axios client for working with the npm registry.

Currently supports authorized communications to:

- Fetch info about a package in the npm repository 

## Usage

```javascript
import runtime from '@skypager/web'
import * as NpmClient from '@skypager/clients-npm'

runtime.use(NpmClient)

const npm = runtime.client('npm', {
  npmToken: process.env.NPM_TOKEN
})

npm.fetchPackageInfo('@some/private-repo').then((packageInfo) => {
  const versions = Object.keys(packageInfo.versions)
})
```