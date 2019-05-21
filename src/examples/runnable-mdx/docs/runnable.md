# Runnable Docs

## Inspect AST

```javascript runnable=true
const runtime = require('@skypager/node')
const DocHelper = require('@skypager/helpers-document')

runtime.use(DocHelper)

async function main() {
  await runtime.mdxDocs.discover()
  const siteTemplate = runtime.mdxDoc('SITE-TEMPLATE')

  await siteTemplate.process()

  return siteTemplate.ast
}

main()
```

multiple codeblocks.  Can reference variables defined in the code blocks aboave above.

```javascript
if(typeof runtime === 'undefined') {
  throw new Error('Code blocks are not sharing context. did you run this with shareContext=false?')
}
```

## Finding Blocks 

### Find Headings By Depth

```javascript runnable=true
const siteTemplate = runtime.mdxDoc('SITE-TEMPLATE')

const findHeadingsByDepth = (depth) => siteTemplate.selectNode(`heading[depth=${depth}]`)

const titles = findHeadingsByDepth(1)
const subtitles = findHeadingsByDepth(2)
const sections = findHeadingsByDepth(3)
```

### Find Code Blocks By Language

The doc helper has a `codeBlocks` property  

```javascript runnable=true
const siteTemplate = runtime.mdxDoc('SITE-TEMPLATE')
const { filter } = siteTemplate.lodash

const findCodeBlocksByLanguage = (lang) => filter(siteTemplate.codeBlocks, { lang })

const javscript = findCodeBlocksByLanguage('javascript')
const shellScripts = findCodeBlocksByLanguage('shell')
```
