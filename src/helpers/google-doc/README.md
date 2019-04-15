# Google Docs Helper

Provides a model for working with google documents

[Learn about their structure](https://developers.google.com/docs/api/concepts/structure)

## Usage

```javascript
import runtime from '@skypager/node'
import * as GoogleDocHelper from '@skypager/helpers-google-doc'

const serviceAccount = require('/path/to/service-account.json')

runtime.use(GoogleDocHelper, {
  serviceAccount
})

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