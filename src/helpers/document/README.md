# Document Helper

The Document Helper is an attempt to unify the content of ES6 JavaScript Modules and Markdown Documents that live along side them.

By treating each file as a unique entity, backed by a `File` object in [@skypager/features-file-manager](../../features/file-manager), 
we rely on the ability to work with each file using their respective AST forms provided by libraries like remark and babel.

An AST consists of a tree of nodes (that can contain other nodes), each node describes what kind of syntax it is and where in the file it was pulled from,
a `Position` object with start line and column, and end line and column.

So with this we can say, give me all of the level 1 headings

```javascript
const mdxFile = runtime.mdxDoc('README')
const level1Headings = mdxFile.body.filter((node) => node.type === 'h1')
```

or give me all of the import declarations in this React component

```javascript
const babelFile = runtime.script('src/components/NavBar')

babelFile.parse().then(() => {
  const { importDeclarations } = babelFile  
  console.log(importDeclarations) // raw import nodes, can be parsed for module identifiers like react, react-dom
})
```

These are pretty low level capabilities, on top of which higher level abstractions can be built.

The [Runnable MDX Example App](../../examples/runnable-mdx) is one example, where we use this to make runnable and live-editable code blocks.

In the future, imagine something like this:

You could write a component which lets you write a markdown file like such

```markdown
---
projectType: react-web-application
customer: Soederpop, Inc
deployTo: zeit
accounts:
  google: soederpops-google
---

# [My Website](https://soederpop.com)

[Sketchfile Link](https://link.to/designer/)
[Mock Data](https://google-sheets.com/my/spreadsheets/my-website/mock-data)
[Page Copy](https://google-docs/my/documents/my-website/content)

## Sitemap 

- [Home](/)
- [About](/about) 
- [Contact US](/contact-us) 
- [Products](/products)
- [Product Details](/products/:id)
```

And from this file, be able to identify 

- `My Website` which lives on `soederpop.com`
- a link to a sketchfile, which you can automatically download and use with [Skypager Sketch Helper](../sketch) 
- a link to a [Google Spreadsheet with Mock Data](../google-sheet)
- a link to a [Google Document with Copy / Content](../google-doc)
- the site's pages and their desired URLs 
- that the site should be deployed to zeit.co
- that the site should use soederpops google account to access the google sheets API

Once we expand these links and understand what they are, we can use them to gather the data and information we need to automate every aspect of building and publishing this website. 

We could use the [Script Helper](src/babel/babel.js) to autogenerate a `react-router` component from this information

```javascript
/** these nodes are standard boilerplate */
import React from 'react' 
import { BrowserRouter, Route } from 'react-router-dom' 
/** these nodes are generated from data */
import { HomePage, AboutPage, ProductsPage, ProductDetailsPage } from './pages'

/** this is easily templateable */
export default function WebsiteRouter() {
  return (
    <BrowserRouter>
      {/** this is all data driven */}
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:id" component={ProductDetailsPage} />
      {/** this is all data driven */}
    </BrowserRouter>
  )  
}
```

By [parsing the layer and sketch file information](../sketch/test/fixtures), we can even generate much of the pages, and theming code.