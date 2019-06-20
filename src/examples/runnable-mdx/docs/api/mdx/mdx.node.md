# MDX Node Helper 

## Members

<dl>
<dt><a href="#file">file</a> : <code><a href="#FileWrapper">FileWrapper</a></code></dt>
<dd><p>Reference to the underlying file wrapper in skypager&#39;s file manager.</p>
</dd>
<dt><a href="#content">content</a> : <code>String</code></dt>
<dd></dd>
<dt><a href="#childScripts">childScripts</a> : <code><a href="#Babel">Array.&lt;Babel&gt;</a></code></dt>
<dd><p>Each codeblock can be turned into a script helper instance, giving us the ability to analyze the AST of a single block</p>
</dd>
<dt><a href="#childRunners">childRunners</a> : <code><a href="#VmRunner">Array.&lt;VmRunner&gt;</a></code></dt>
<dd><p>Returns the VM Script Runner for each of the child scripts</p>
</dd>
<dt><a href="#resultsByExportName">resultsByExportName</a> : <code>Object</code></dt>
<dd><p>Returns the results of each script that has been run.  Scripts will be keyed by their exportName,
which is derived from the parent heading the code block belongs to.</p>
</dd>
<dt><a href="#runners">runners</a> : <code><a href="#VmRunner">Array.&lt;VmRunner&gt;</a></code></dt>
<dd><p>Returns the VMRunners for each of this document&#39;s code blocks.</p>
</dd>
<dt><a href="#headingLineNumbers">headingLineNumbers</a> : <code>Object.&lt;String, Number&gt;</code></dt>
<dd><p>Returns the line numbers of each heading found in the document.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#run">run(options)</a></dt>
<dd><p>Runs all of the code blocks.</p>
</dd>
<dt><a href="#toExport">toExport(options)</a> ⇒ <code>Promise.&lt;Object.&lt;String, function()&gt;&gt;</code></dt>
<dd><p>Compiles each of the code blocks and exports an object of functions that can be used to run the code block.</p>
</dd>
<dt><a href="#toFunctions">toFunctions(options)</a> ⇒ <code>Object.&lt;String, function()&gt;</code></dt>
<dd></dd>
<dt><a href="#toRunnable">toRunnable()</a> ⇒</dt>
<dd><p>Converts this document instance to a runnable document instance. Involves creating VMRunner objects for each code block.</p>
</dd>
<dt><a href="#toScriptHelper">toScriptHelper()</a> ⇒ <code><a href="#Babel">Promise.&lt;Babel&gt;</a></code></dt>
<dd><p>Creates a Babel script helper instance for this document&#39;s JS content.</p>
</dd>
<dt><a href="#process">process(options)</a> ⇒ <code><a href="#ParsedMdx">Promise.&lt;ParsedMdx&gt;</a></code></dt>
<dd><p>Uses @skypager/helpers-mdx to convert the content of this markdown document to
a JavaScript module consisting of the React Component, AST, Headings Map, etc.</p>
<p>Useful when all you have is the content markdown as a string.</p>
</dd>
<dt><a href="#parse">parse()</a></dt>
<dd><p>Takes the raw markdown mdx content, and parses it with mdx, returning jsx code</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#FileWrapper">FileWrapper</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Babel">Babel</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#VmRunner">VmRunner</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ParsedMdx">ParsedMdx</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="file"></a>

## file : [<code>FileWrapper</code>](#FileWrapper)
Reference to the underlying file wrapper in skypager's file manager.

**Kind**: global variable  
<a name="content"></a>

## content : <code>String</code>
**Kind**: global variable  
<a name="childScripts"></a>

## childScripts : [<code>Array.&lt;Babel&gt;</code>](#Babel)
Each codeblock can be turned into a script helper instance, giving us the ability to analyze the AST of a single block

**Kind**: global variable  
<a name="childRunners"></a>

## childRunners : [<code>Array.&lt;VmRunner&gt;</code>](#VmRunner)
Returns the VM Script Runner for each of the child scripts

**Kind**: global variable  
<a name="resultsByExportName"></a>

## resultsByExportName : <code>Object</code>
Returns the results of each script that has been run.  Scripts will be keyed by their exportName,
which is derived from the parent heading the code block belongs to.

**Kind**: global variable  
<a name="runners"></a>

## runners : [<code>Array.&lt;VmRunner&gt;</code>](#VmRunner)
Returns the VMRunners for each of this document's code blocks.

**Kind**: global variable  
<a name="headingLineNumbers"></a>

## headingLineNumbers : <code>Object.&lt;String, Number&gt;</code>
Returns the line numbers of each heading found in the document.

**Kind**: global variable  
<a name="run"></a>

## run(options)
Runs all of the code blocks.

**Kind**: global function  

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 

<a name="toExport"></a>

## toExport(options) ⇒ <code>Promise.&lt;Object.&lt;String, function()&gt;&gt;</code>
Compiles each of the code blocks and exports an object of functions that can be used to run the code block.

**Kind**: global function  

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 

<a name="toFunctions"></a>

## toFunctions(options) ⇒ <code>Object.&lt;String, function()&gt;</code>
**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  |  |
| [options.merge] | <code>Boolean</code> | <code>false</code> | passing true will combine multiple blocks under the same heading into a single function |
| [options.nameFn] | <code>function</code> |  | a function which will return the name of the function for a given codeblock |

<a name="toRunnable"></a>

## toRunnable() ⇒
Converts this document instance to a runnable document instance. Involves creating VMRunner objects for each code block.

**Kind**: global function  
**Returns**: this  
<a name="toScriptHelper"></a>

## toScriptHelper() ⇒ [<code>Promise.&lt;Babel&gt;</code>](#Babel)
Creates a Babel script helper instance for this document's JS content.

**Kind**: global function  
<a name="process"></a>

## process(options) ⇒ [<code>Promise.&lt;ParsedMdx&gt;</code>](#ParsedMdx)
Uses @skypager/helpers-mdx to convert the content of this markdown document to
a JavaScript module consisting of the React Component, AST, Headings Map, etc.

Useful when all you have is the content markdown as a string.

**Kind**: global function  

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 

<a name="parse"></a>

## parse()
Takes the raw markdown mdx content, and parses it with mdx, returning jsx code

**Kind**: global function  
<a name="FileWrapper"></a>

## FileWrapper : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| content | <code>String</code> | 
| hash | <code>String</code> | 
| path | <code>String</code> | 
| relative | <code>String</code> | 
| dir | <code>String</code> | 
| relativeDirname | <code>String</code> | 
| stats | <code>Object</code> | 

<a name="Babel"></a>

## Babel : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| ast | <code>Object</code> | 
| findNodes | <code>function</code> | 

<a name="VmRunner"></a>

## VmRunner : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| run | <code>function</code> | 
| results | <code>Array</code> | 

<a name="ParsedMdx"></a>

## ParsedMdx : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| code | <code>String</code> | 
| ast | <code>Object</code> | 
| meta | <code>Object</code> | 
| headingsMap | <code>Object</code> | 
| default | <code>function</code> |