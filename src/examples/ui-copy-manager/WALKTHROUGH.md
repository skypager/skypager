# UI Copy Manager Walkthrough

In this example, we have a script [scripts/sync.js](scripts/sync.js), which we can call
to either update a spreadsheet with strings found in our web application, or to update previously
identified stirng elements with a new value from the spreadsheet.

We can use the [@skypager/cli](../../devtools/cli) to run this script.

To see all available options:

```shell
$ skypager sync help
```

To update the sheet with our strings

```shell
$ skypager sync
```

To update our application with new strings edited in the spreadsheet.

```shell
$ skypager sync inbound
```

## How does it work

### Step Zero: We setup the project to use the google sheet helper 

Following the Setup Requirements in [README](./README.md)

```javascript
const serviceAccount = runtime.resolve('secrets/serviceAccount.json')
const runtime = require('@skypager/node')
  .use(require('@skypager/helpers-document'))
  .use(require('@skypager/helpers-sheet', {
    serviceAccount,
    projectId: require(serviceAccount).project_id
  }))
```
### Step One: Uses @skypager/helpers-document to parse your React Components

```javascript
async function loadReactComponents() {
  await runtime.scripts.discover({ include: [/src.*(components|pages).*\.js$/] })
  return runtime.scripts.available
} 

loadReactComponents()
```

### Step Two: Find all of the StringLiteral or JSXAttribute nodes in the file

```javascript
const homePage = runtime.script('src/pages/HomePage')
const jsxAttributesWithStringLiterals = runtime
  .findNodes(({ parent, node }) => node.type === 'StringLiteral' && parent.type === 'JSXAttribute')

const onlyPropsNamedContent = jsxAttributesWithStringLiterals.filter(({ parent }) => parent.name && parent.name.name === 'content')
```

### Step Three: Get the string value, and create an entry for this node in the spreadsheet

```javascript
const { at } = runtime.lodash
const records = onlyPropsNamedContent.map(({ node }) => ({
  lineNumber: node.loc.start.line,
  loc: node.loc,
  value: node.value, 
  nodeId: at(node.loc, 'start.line', 'start.column', 'end.line', 'end.column').join(':')
}))
```





