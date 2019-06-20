# MDX Helper

## Classes

<dl>
<dt><a href="#Mdx">Mdx</a></dt>
<dd><p>The Mdx Helper is a wrapper around markdown documents, and supports MDX.  Treats each document as a unique entity, with state,
and provides access to the documents content, its remark and rehype AST, metadata parsed from YAML frontmatter MDX&#39;s export const meta = {}.</p>
<p>You can query each document to detect certain nodes, such as headings, lists, paragraphs, codeblocks etc.  The Mdx Helper attaches to the
skypager runtime and creates an mdxDocs property, which acts as a registry for all known Mdx instances found in the project.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Registry">Registry</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#HeadingsMap">HeadingsMap</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Coordinates">Coordinates</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Position">Position</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#RemarkAST">RemarkAST</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#RemarkASTNode">RemarkASTNode</a> : <code>Object</code></dt>
<dd><p>The Remark AST is made up of nodes. Nodes are
of a specific type based on their markdown syntax.  Every 
node has a position in the document, line number and column</p>
</dd>
<dt><a href="#RemarkASTCodeNode">RemarkASTCodeNode</a> : <code>Object</code></dt>
<dd><p>The Remark AST represents fenced codeblocks
with optional language identifiers as type=code
any additional name=value pairs that come after language 
are arbitrary properties</p>
</dd>
<dt><a href="#RemarkASTHeadingNode">RemarkASTHeadingNode</a> : <code>Object</code></dt>
<dd><p>The Remark AST represents heading nodes with their depth
equal to the number of hashtags used to indicate heading level</p>
</dd>
<dt><a href="#ResolvedDocLink">ResolvedDocLink</a> : <code>Object</code></dt>
<dd><p>A markdown link to a doc:// url will resolve to some action
which can render content in place of that link tag.</p>
</dd>
</dl>

<a name="Mdx"></a>

## Mdx
The Mdx Helper is a wrapper around markdown documents, and supports MDX.  Treats each document as a unique entity, with state,
and provides access to the documents content, its remark and rehype AST, metadata parsed from YAML frontmatter MDX's export const meta = {}.

You can query each document to detect certain nodes, such as headings, lists, paragraphs, codeblocks etc.  The Mdx Helper attaches to the
skypager runtime and creates an mdxDocs property, which acts as a registry for all known Mdx instances found in the project.

**Kind**: global class  

* [Mdx](#Mdx)
    * [.actions](#Mdx+actions)
    * [.sandboxes](#Mdx+sandboxes)
    * [.title](#Mdx+title) : <code>String</code>
    * [.headingsMap](#Mdx+headingsMap) : [<code>HeadingsMap</code>](#HeadingsMap)
    * [.meta](#Mdx+meta) : <code>Object</code>
    * [.ast](#Mdx+ast) : [<code>RemarkAST</code>](#RemarkAST)
    * [.rehypeAst](#Mdx+rehypeAst) : [<code>RemarkAST</code>](#RemarkAST)
    * [.body](#Mdx+body) : [<code>Array.&lt;RemarkASTNode&gt;</code>](#RemarkASTNode)
    * [.headingNodes](#Mdx+headingNodes) : [<code>Array.&lt;RemarkASTHeadingNode&gt;</code>](#RemarkASTHeadingNode)
    * [.codeBlocks](#Mdx+codeBlocks) : [<code>Array.&lt;RemarkASTCodeNode&gt;</code>](#RemarkASTCodeNode)
    * [.javascriptBlocks](#Mdx+javascriptBlocks) : [<code>Array.&lt;RemarkASTCodeNode&gt;</code>](#RemarkASTCodeNode)
    * [.shellBlocks](#Mdx+shellBlocks) : [<code>Array.&lt;RemarkASTCodeNode&gt;</code>](#RemarkASTCodeNode)
    * [.structure](#Mdx+structure) : <code>Array.&lt;Array&gt;</code>
    * [.sharedSandboxes](#Mdx+sharedSandboxes) : [<code>Registry</code>](#Registry)
    * [.sharedActions](#Mdx+sharedActions) : [<code>Registry</code>](#Registry)
    * [.Component](#Mdx+Component)
    * [.visit(fn, [base])](#Mdx+visit)
    * [.stringify(node)](#Mdx+stringify) ⇒ <code>String</code>
    * [.findAllNodesAfter(indexOrNode, test, [base])](#Mdx+findAllNodesAfter) ⇒ [<code>Array.&lt;RemarkASTNode&gt;</code>](#RemarkASTNode)
    * [.findAllNodesBefore(indexOrNode, test, [base])](#Mdx+findAllNodesBefore) ⇒ [<code>Array.&lt;RemarkASTNode&gt;</code>](#RemarkASTNode)
    * [.findNodesAfter(indexOrNode, test, [base])](#Mdx+findNodesAfter) ⇒ [<code>RemarkASTNode</code>](#RemarkASTNode)
    * [.select(selector, [base])](#Mdx+select) ⇒ <code>Array.&lt;(RemarkASTNode\|RemarkASTHeadingNode\|RemarkASTCodeNode)&gt;</code>
    * [.selectNode(selector, [base])](#Mdx+selectNode) ⇒ [<code>RemarkASTNode</code>](#RemarkASTNode) \| [<code>RemarkASTCodeNode</code>](#RemarkASTCodeNode) \| [<code>RemarkASTHeadingNode</code>](#RemarkASTHeadingNode)
    * [.findParentHeading(node, options)](#Mdx+findParentHeading) ⇒ <code>String</code> \| [<code>RemarkASTHeadingNode</code>](#RemarkASTHeadingNode) \| [<code>RemarkASTNode</code>](#RemarkASTNode)
    * [.sandbox(sandboxId)](#Mdx+sandbox) ⇒ <code>Object</code>
    * [.action(actionId)](#Mdx+action) ⇒ <code>function</code>
    * [.renderLinkTo(docLink)](#Mdx+renderLinkTo) ⇒ <code>Object</code> \| <code>String</code>
    * [.resolveDocLink()](#Mdx+resolveDocLink) ⇒ [<code>ResolvedDocLink</code>](#ResolvedDocLink)

<a name="Mdx+actions"></a>

### mdx.actions
**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
**Properties**

| Name | Type |
| --- | --- |
| actions | [<code>Registry</code>](#Registry) | 

<a name="Mdx+sandboxes"></a>

### mdx.sandboxes
**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
**Properties**

| Name | Type |
| --- | --- |
| sandboxes | [<code>Registry</code>](#Registry) | 

<a name="Mdx+title"></a>

### mdx.title : <code>String</code>
Returns the document title, which is either specified in the document metadata
or by using the first heading encountered.  If no headings are encountered,
then we format the name of the document and try to guess the title based on that

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+headingsMap"></a>

### mdx.headingsMap : [<code>HeadingsMap</code>](#HeadingsMap)
The mdx webpack loader generates this heading element index by parsing the ast,
it tells us which headings are found and their line number in the document.

The HeadingsMap lines maps line numbers to the heading text, and the headings map
shows which line numbers headings are on based on their text.

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+meta"></a>

### mdx.meta : <code>Object</code>
The mdx webpack loader generates this property when either YAML frontmatter is encountered
or if the document uses actual mdx syntax and exports a meta property.

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+ast"></a>

### mdx.ast : [<code>RemarkAST</code>](#RemarkAST)
The @skypager/webpack/markdown-loader generates this property.  It is the remark ast that can be used to traverse
the markdown documents before rendering it as html or mdx.

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+rehypeAst"></a>

### mdx.rehypeAst : [<code>RemarkAST</code>](#RemarkAST)
The @skypager/webpack/markdown-loader generates this property.  It is the rehype ast that can be used to traverse
the markdown documents before rendering it as React components.

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+body"></a>

### mdx.body : [<code>Array.&lt;RemarkASTNode&gt;</code>](#RemarkASTNode)
Returns the AST's top level child nodes.

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+headingNodes"></a>

### mdx.headingNodes : [<code>Array.&lt;RemarkASTHeadingNode&gt;</code>](#RemarkASTHeadingNode)
**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+codeBlocks"></a>

### mdx.codeBlocks : [<code>Array.&lt;RemarkASTCodeNode&gt;</code>](#RemarkASTCodeNode)
Returns all of the nodes of type code.  Uses MDX's language tag parser to treat name=value pairs after the code's language
to treat these as abitrary attributes for the code block.  These attributes will be passed as props when we're using MDX
which lets us build our renderable and runnable example blocks.

**Kind**: instance property of [<code>Mdx</code>](#Mdx)  
<a name="Mdx+javascriptBlock