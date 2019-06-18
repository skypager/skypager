# Metadata

Your markdown can include YAML frontmatter.

It can also export meta as javascript.

```javascript
export const meta = {
  whatever: 'you like',
  objects: { are: 'supported too' }
}
```

All of this data will be merged into a single export by @skypager/helpers-mdx/parser.

## Dynamic Metadata

Using the frontmatter, or meta export approach, you can have whatever metadata you explicitly define.  
You can query all of the mdx documents by their metadata.

```javascript
runtime.mdxDocs.allInstances().filter((doc) => {
  if (doc.meta && doc.meta.status === 'draft') {
    return false
  }

  return true
})
```

This can be limiting, and tedious, since all of the metadata has to be explicitly typed out.  

You may want to have computed metadata attributes that are derived from the document's title, the document's file name, the languages of the code blocks used in the document.  

You might want to find all of the documents which contain images, or links.

The MDX Helper class instance provides all of the things you need to implement this kind of filtering logic, above and beyond static metadata.
