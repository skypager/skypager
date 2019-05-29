# Unpkg Demo

This demo uses [unpkg](https://unpkg.com) to provide your document with dependencies from npm.

## Defining Imports 

We wil need to define a section called imports, so that the document helper can identify the following list element,
and use it to extract the necessary pieces of information we need about the dependencies we're pulling from npm.

We need to know the `global variable name` and the path to the module on `unpkg.com`. 

For example, the following markdown list can convey the information

```markdown
- [React](react@16.8.6/umd/react.development.js)
- [ReactDOM](react-dom@16.8.6/umd/react-dom.development.js)
```

## Imports

We're going to be loading the [Zdog](https://zzz.dog) library for working with svg and canvas.

We can type it as a link.

- [Zdog](zdog@1.0.1/js/index.js)

We can parse this list element 

```javascript renderable=true
const doc = $doc
const importSectionNode = $doc.body.find(({ position }) => 
  positon.start.line === $doc.headingsMap.headings.imports[0]
)

function ParsedOutput() {
  return (<pre>hello</pre>)
}

<ParsedOutput />
```