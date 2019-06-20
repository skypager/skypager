# Babel Helper

## Classes

<dl>
<dt><a href="#Babel">Babel</a></dt>
<dd><p>The Babel Helper lets us work with our JavaScript files and their AST</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Program">Program</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#BabelAST">BabelAST</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Coordinates">Coordinates</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ASTPath">ASTPath</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ASTNode">ASTNode</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SourcePosition">SourcePosition</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SourceExtraction">SourceExtraction</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#FileObject">FileObject</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#UndocumentedReport">UndocumentedReport</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Babel"></a>

## Babel
The Babel Helper lets us work with our JavaScript files and their AST

**Kind**: global class  

* [Babel](#Babel)
    * [.babel](#Babel+babel)
    * [.ast](#Babel+ast) : [<code>BabelAST</code>](#BabelAST)
    * [.ast](#Babel+ast)
    * [.comments](#Babel+comments) : [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
    * [.body](#Babel+body) : [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
    * [.bodyNodeTypes](#Babel+bodyNodeTypes) : <code>Array.&lt;String&gt;</code>
    * [.content](#Babel+content)
    * [.unwrappedContent](#Babel+unwrappedContent) : <code>String</code>
    * [.file](#Babel+file) : [<code>FileObject</code>](#FileObject)
    * [.importDeclarations](#Babel+importDeclarations) : [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
    * [.exportDeclarations](#Babel+exportDeclarations) : <code>Array.&lt;{index: Number, node: ASTNode}&gt;</code>
    * [.classDeclarations](#Babel+classDeclarations) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.classInstanceMethods](#Babel+classInstanceMethods) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.classGetters](#Babel+classGetters) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.staticClassMethods](#Babel+staticClassMethods) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.staticClassGetters](#Babel+staticClassGetters) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.classProperties](#Babel+classProperties) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.staticClassProperties](#Babel+staticClassProperties) : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.undocumentedClassMembers](#Babel+undocumentedClassMembers) : [<code>Array.&lt;UndocumentedReport&gt;</code>](#UndocumentedReport)
    * [.importsModules](#Babel+importsModules) : <code>Array.&lt;String&gt;</code>
    * [.exportNames](#Babel+exportNames) : <code>Array.&lt;String&gt;</code>
    * [.exportData](#Babel+exportData)
    * [.exportBlocks](#Babel+exportBlocks)
    * [.parse(options)](#Babel+parse)
    * [.transformAst(options)](#Babel+transformAst) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.findNodes(options)](#Babel+findNodes) ⇒ [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
    * [.extractSourceFromLocations(begin, end)](#Babel+extractSourceFromLocations) ⇒ [<code>SourceExtraction</code>](#SourceExtraction)
    * [.findChildNodes(parentNode, options)](#Babel+findChildNodes) ⇒ [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
    * [.findLines(patterns, [includeInfo])](#Babel+findLines) ⇒ <code>Array.&lt;String&gt;</code>
    * [.sliceModule(...exportNames)](#Babel+sliceModule) ⇒ <code>Object</code>
    * [.getBabelConfig(options)](#Babel+getBabelConfig) ⇒ <code>Object</code>
    * [.findNodesByExportName()](#Babel+findNodesByExportName) ⇒ [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)

<a name="Babel+babel"></a>

### babel.babel
Provides access to the @babel modules we rely on to traverse the AST

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+ast"></a>

### babel.ast : [<code>BabelAST</code>](#BabelAST)
Returns the ast that parse() generated.

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+ast"></a>

### babel.ast
Replaces the current AST with a new one

**Kind**: instance property of [<code>Babel</code>](#Babel)  

| Param | Type |
| --- | --- |
| value | [<code>BabelAST</code>](#BabelAST) | 

<a name="Babel+comments"></a>

### babel.comments : [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
Provides access to the comment nodes in the script

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+body"></a>

### babel.body : [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
The body section of the ast.program are the main nodes in the script

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+bodyNodeTypes"></a>

### babel.bodyNodeTypes : <code>Array.&lt;String&gt;</code>
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+content"></a>

### babel.content
The file content of the script.  May include wrapper content if the script helper instance or the scripts registry has a wrapContent function

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+unwrappedContent"></a>

### babel.unwrappedContent : <code>String</code>
The raw content that powers this script helper.  Could have been passed in as options on create,
registered as a provider, or be a part of a file discovered in the file manager.  Depending on how
the script helper instance was created.

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+file"></a>

### babel.file : [<code>FileObject</code>](#FileObject)
If there is an underlying file object in the file manager, for example,
this will refer to that.

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+importDeclarations"></a>

### babel.importDeclarations : [<code>Array.&lt;ASTNode&gt;</code>](#ASTNode)
Gives us all of the nodes of type ImportDeclaration

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+exportDeclarations"></a>

### babel.exportDeclarations : <code>Array.&lt;{index: Number, node: ASTNode}&gt;</code>
Gives us all of the nodes that export something from the module

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+classDeclarations"></a>

### babel.classDeclarations : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+classInstanceMethods"></a>

### babel.classInstanceMethods : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+classGetters"></a>

### babel.classGetters : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+staticClassMethods"></a>

### babel.staticClassMethods : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+staticClassGetters"></a>

### babel.staticClassGetters : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+classProperties"></a>

### babel.classProperties : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+staticClassProperties"></a>

### babel.staticClassProperties : [<code>Array.&lt;ASTPath&gt;</code>](#ASTPath)
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+undocumentedClassMembers"></a>

### babel.undocumentedClassMembers : [<code>Array.&lt;UndocumentedReport&gt;</code>](#UndocumentedReport)
Returns the undocumented class members

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+importsModules"></a>

### babel.importsModules : <code>Array.&lt;String&gt;</code>
Lists the modules the script imports using es6 import syntax

**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Babel+exportNames"></a>

### babel.exportNames : <code>Array.&lt;String&gt;</code>
**Kind**: instance property of [<code>Babel</code>](#Babel)  
<a name="Bab