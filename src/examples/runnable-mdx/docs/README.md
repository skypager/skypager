# Skypager Document Helper
> Interactive Documents powered by MDX and Babel

The Skypager Document Helper can be used to represent any source code file, such as a Markdown file (with MDX) or a JavaScript module.

Each file has its own unique instance of the document helper,  for example:

```javascript
const readme = runtime.mdxDoc('README')
const about = runtime.mdxDoc('ABOUT')
```

and each of these helpers can be queried to find information from the document, for example all of the javascript code examples under the `Examples` heading.

```javascript
const exampleJavascriptBlocks = readme.select('code')
  .filter((block) => readme.findParentHeading(block, { stringify: true }) === 'Examples' )
```

or the unique set of code languages 

```javascript
const languages = new Set(readme.select('code[lang]').map(({ lang }) => lang))
```

The document helper will give you access to the pure source code, the transpiled code, as well as access to the [AST](https://astexplorer.net) (the structured data that represents how different tools such as Webpack, Babel or MDX interpret our code in a  machine searchable way.)

One example of something you can build with it, is our [UI Copy Manager Example](https://github.com/skypager/skypager/tree/master/src/examples/ui-copy-manager).  In this example, we find all of our React components and automatically upload all of the string literals found in them to a Google Spreadsheet.  

We take any changes made in the spreadsheet, and re-apply them directly to the source code.  You would never know, from looking at the git history, if these changes came from a developer in their IDE or through the tool. 

This kind of seamless integration between the source code and the useful information it contains is one thing the document helper makes possible.

Since the kind of writing that lives in JavaScript source code and markdown documentation is highly structured and pattern based, we can take advantage of this in a lot of creative ways.

## Usage in Node

Using the document helper in node can be the most useful.  

Think of it as a way of powering all kinds of automated tasks that are based off of the content in your writing, while you're still in the authoring context.

The easiest way to get started is to use the helper module, and then discover the available documents in your project that you can work with.

```javascript editable=false
import runtime from 'skypager'
import DocumentHelper from '@skypager/helpers-document'

runtime.use(DocumentHelper)

async function main() {
  // discover all of the .md and .mdx files in your project
  await runtime.mdxDocs.discover()
  // discover all of the .js files in your project
  await runtime.scripts.discover()
}

main()
```

once you have "discovered" documents, they will be registered in the `mdxDocs` and `scripts` registries on the skypager runtime.

You can work with them as if they were unique database records.  

### Working with Markdown documents in node

In the example below, we're generating a `TABLE OF CONTENTS` markdown document that automatically links to all of our other documents and their sections.

This beats maintaining it by hand, and only scratches the surface of what is possible once you can access all of your writing as data.

```javascript
async function buildSiteTableOfContents() {
  // assuming the TOC can be generated from each README.md file in the project
  const allReadmes = runtime.mdxDocs.filter(doc => doc.name.match(/README/))
  // Convert each README file into an object which tells us the document title, and all of its headings
  const allTables = await Promise.all(allReadmes.map(getTableOfContents))
  // Convert each object containing title, and sections info into markdown content 
  const markdownTOC = await Promise.all(allTables.map(generateTOCMarkdown))

  await runtime.fsx.writeFileAsync(
    runtime.resolve('TABLE-OF-CONTENTS.md'),
    markdownTOC.join("\n"),
    "utf8"
  )
}

async function getTableOfContents(readme) {
  await readme.process()
  const { title } = readme
  const headings = readme.select('heading')

  return {
    title,
    documentId: readme.name,
    sections: headings.map((heading) => ({
      title: readme.stringify(heading),
      depth: heading.depth
    }))
  }
}


function toLink(documentId, sectionHeading = '') {
  return `/docs/${documentId}${sectionHeading.length ? `#${String(sectionHeading).toLowerCase().replace(/\s*/g,'-')}` : ''}`
}

function generateTOCMarkdown({ documentId, title, sections = [] }) {
  function toHeading(title, depth) {
    if (depth >= 6) { 
      depth = 6
    }

    const prefix = Array.from( new Array(depth) ).map(v => '#').join('')

    return `${prefix} [${title}](${toLink(documentId, title)})`
  }

  return [
    `## [${title}](${toLink(documentId, title)})`
  ].concat( 
    sections.map(({ title: sectionTitle, depth }) => toHeading(sectionTitle, depth)) 
  ).join("\n")
}
```

### Working with Babel Source Code Helpers in Node

Each instance of the script helper, since it has access to the AST form generated by Babel, can contain a wealth of useful metadata and information about your JavaScript code.

And since the names of our javascript files, and the names of our variables, often overlap with the content of our markdown writing (and really all of our communication about our projects), the ability to access and work with the source code using this information offers an entire platform to different applications.

**Example: finding all of the modules which import React**

```javascript
const reactDependents = runtime.scripts.findAllBy((script) => script.importsModules.indexOf('react') >= -1)

// now we can print their default name
const defaultExportNames = reactDependents.filter((mod) => mod.defaultExportName)
```

Once you had all of names for the components in your project, you could write a plugin for automatically linking any references to the components in your markdown to the source code definitio on github, for example. 

## Browser Usage 

```html
<html>
  <body>
    <script src="https://unpkg.com/skypager"></script>
    <script src="https://unpkg.com/@skypager/helpers-document"></script>
    <script>
      skypager.use(SkypagerHelpersDocument)
    </script>
  </body>
</html>
```

In the browser, you can load our editor component which is based on [React Ace](https://github.com/securingsincity/react-ace/) 

This can be used to make all of your code blocks renderable or runnable.

The tools to turn MDX or JavaScript into browser friendly modules run on the server.  

So using the document helper in the browser is more useful for presenting information about the document. 
