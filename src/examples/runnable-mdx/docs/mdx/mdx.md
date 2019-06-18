# MDX Utils 

The @skypager/helpers-mdx package provides you with a webpack loader, as well as an mdx parser that will turn mdx markdown code into JSX.

When running in node, the @skypager/helpers-document module provides you with the MDX Helper class.  Each instance of the MDX Helper can turn its own content into JSX automatically using the parser.

The JSX output created by this library differs from standard MDX output in a few small ways.  ( We provide a few additional rehype / remark plugins to create additional annotations in the output. )

## Special Exports

- `headingsMap`
- `ast`
- `meta` the data on the meta export will include YAML frontmatter, as well as any javascript meta export used by the mdx syntax.
