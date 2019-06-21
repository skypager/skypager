<a name="GoogleDoc"></a>

## GoogleDoc
The GoogleDoc Helper represents an individual google document stored on google drive, as a stateful
javascript module.  You can discover all of the google documents available at runtime, or you can
have a module file in your project that exports a property documentId that is the unique id from the URL
for the google document you want to work with.

As an individual module instance, you can read and write to the document and analyze its AST, and select various
elements from the document using semantic patterns, headings , etc.

The GoogleDoc Helper attaches a registry of many possible google document instances available to you.  This allows you to
join the documents together and aggregate information from them all in one place.  Use it to generate a static website,
for example.

If you use google document templates that have common headings, you can build modules for working with all of the documents
which follow the format.  

Use this class to build a content object model, by combining content from a collection of google documents with javascript modules
that work with their contents.

**Kind**: global class  

* [GoogleDoc](#GoogleDoc)
    * [.revisionId](#GoogleDoc+revisionId) : <code>String</code>
    * [.documentId](#GoogleDoc+documentId) : <code>String</code>
    * [.title](#GoogleDoc+title) : <code>String</code>
    * [.doc](#GoogleDoc+doc) : <code>Object</code>
    * [.loadedAt](#GoogleDoc+loadedAt) : <code>Number</code>
    * [.contentNodes](#GoogleDoc+contentNodes) : <code>Array</code>
    * [.hasLoadError](#GoogleDoc+hasLoadError) : <code>Boolean</code>
    * [.loadError](#GoogleDoc+loadError) : <code>Error</code>
    * [.paragraphContents](#GoogleDoc+paragraphContents) ⇒ <code>Array.&lt;String&gt;</code>
    * [.headingContents](#GoogleDoc+headingContents) : <code>Array.&lt;String&gt;</code>
    * [.paragraphNodes](#GoogleDoc+paragraphNodes) : <code>Array</code>
    * [.headingNodes](#GoogleDoc+headingNodes) : <code>Array</code>
    * [.tableNodes](#GoogleDoc+tableNodes) : <code>Array</code>
    * [.lists](#GoogleDoc+lists) : <code>Array</code>
    * [.headingElements](#GoogleDoc+headingElements) : <code>Array</code>
    * [.paragraphElements](#GoogleDoc+paragraphElements) : <code>Array</code>
    * [.style](#GoogleDoc+style)
    * [.namedStyles](#GoogleDoc+namedStyles) : <code>Object.&lt;String, Object&gt;</code>
    * [.initialize()](#GoogleDoc+initialize)
    * [.load(options)](#GoogleDoc+load)
    * [.dump(outputPath, [prettify])](#GoogleDoc+dump)

<a name="GoogleDoc+revisionId"></a>

### googleDoc.revisionId : <code>String</code>
Returns the revisionId of this document

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+documentId"></a>

### googleDoc.documentId : <code>String</code>
Returns the documentId of this document. This is the unique component of the URL for this google document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+title"></a>

### googleDoc.title : <code>String</code>
Returns the title of the Google Document Drive File.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+doc"></a>

### googleDoc.doc : <code>Object</code>
Returns the raw GoogleDocument wrapper

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+loadedAt"></a>

### googleDoc.loadedAt : <code>Number</code>
Returns the latest time the document was loaded into memory for this instance.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+contentNodes"></a>

### googleDoc.contentNodes : <code>Array</code>
Returns the content AST nodes for this document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+hasLoadError"></a>

### googleDoc.hasLoadError : <code>Boolean</code>
Returns true if there was an error loading the document from the Google API

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+loadError"></a>

### googleDoc.loadError : <code>Error</code>
Returns the error that was thrown when you attempted to load the document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+paragraphContents"></a>

### googleDoc.paragraphContents ⇒ <code>Array.&lt;String&gt;</code>
Returns the stringified contents of the paragraph nodes in the document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+headingContents"></a>

### googleDoc.headingContents : <code>Array.&lt;String&gt;</code>
Returns the stringified contents of the document's headings.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+paragraphNodes"></a>

### googleDoc.paragraphNodes : <code>Array</code>
Returns the paragraph AST nodes from the document

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+headingNodes"></a>

### googleDoc.headingNodes : <code>Array</code>
Returns the heading AST nodes from the document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+tableNodes"></a>

### googleDoc.tableNodes : <code>Array</code>
Returns the table AST nodes from the document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+lists"></a>

### googleDoc.lists : <code>Array</code>
Returns the list AST nodes from the document.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+headingElements"></a>

### googleDoc.headingElements : <code>Array</code>
Returns an array of content element nodes from the document headings.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+paragraphElements"></a>

### googleDoc.paragraphElements : <code>Array</code>
Returns the an array of paragraph content element nodes from the document paragraphs.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+style"></a>

### googleDoc.style
Returns the documents stylesheet

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+namedStyles"></a>

### googleDoc.namedStyles : <code>Object.&lt;String, Object&gt;</code>
Returns an object of style rules, keyed by the name of the rule.

**Kind**: instance property of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+initialize"></a>

### googleDoc.initialize()
This lifecycle hook gets automatically called whenever you create an instance of the GoogleDoc Helper,
which is typically done using the `runtime.googleDoc` factory function.

As part of the initialize hook, we load the document skeleton from the google API,
and call an optional initialize function if one was passed as options or registered as a provider module
with the googleDocs registry.

**Kind**: instance method of [<code>GoogleDoc</code>](#GoogleDoc)  
<a name="GoogleDoc+load"></a>

### googleDoc.load(options)
Loads the document data from Google's API and stores it in the local helper instance's state.

**Kind**: instance method of [<code>GoogleDoc</code>](#GoogleDoc)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  |  |
| [options.path] | <code>String</code> |  | if you want to load from a JSON dump instead of Google Drive |
| [options.remote] | <code>Boolean</code> | <code>true</code> | if you want to load remotely from google drive.  pass false if you're passing a path. |

<a name="GoogleDoc+dump"></a>

### googleDoc.dump(outputPath, [prettify])
Dump the JSON AST contents to disk somewhere.

**Kind**: instance method of [<code>GoogleDoc</code>](#GoogleDoc)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| outputPath | <code>String</code> |  |  |
| [prettify] | <code>Boolean</code> | <code>true</code> | whether to include whitespace in the JSON output |