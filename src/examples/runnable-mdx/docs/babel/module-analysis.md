# Module Analysis

The @skypager/helpers-document module provides us with the Babel Script Helper.

Each instance of the Script Helper corresponds to a source code module in your project.  By default, when you say

```javascript
const runtime = require('@skypager/node')
runtime.use(require('@skypager/helpers-document'))
runtime.scripts.discover()
```

The @skypager/node runtime uses @skypager/features-file-manager to scan your project for `.js` files.

It hashes the file, and loads the content into a file object that contains metadata about the underlying file.

It creates an instance of the script helper, backed by this file object.  From the `content` of the file, the Script helper has your raw source code.

You call `parse()` on the script helper instance, and all of the sudden it has an `ast` property that corresponds to the Babel AST for that source code.

Now that we have access to the AST, we can perform all manners of analysis on each module.