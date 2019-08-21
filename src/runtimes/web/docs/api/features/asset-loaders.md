<a name="AssetLoader"></a>

## AssetLoader ⇐ <code>Feature</code>
The AssetLoader feature provides async helpers for injecting static asset elements into the page,
as well as helpers for loading javascript packages into the global scope from unpkg.com

**Kind**: global class  
**Extends**: <code>Feature</code>  

* [AssetLoader](#AssetLoader) ⇐ <code>Feature</code>
    * [.image(url, [options])](#AssetLoader.image) ⇒ <code>PromiseLike.&lt;HtmlElement&gt;</code>
    * [.css(url, [options])](#AssetLoader.css) ⇒ <code>PromiseLike.&lt;HtmlElement&gt;</code>
    * [.stylesheet(url, [options])](#AssetLoader.stylesheet) ⇒ <code>PromiseLike.&lt;HtmlElement&gt;</code>
    * [.script(url, [options])](#AssetLoader.script) ⇒ <code>Promise.&lt;HTMLElement&gt;</code>
    * [.unpkg(dependencies, options)](#AssetLoader.unpkg) ⇒ <code>Object.&lt;String, Object&gt;</code>

<a name="AssetLoader.image"></a>

### AssetLoader.image(url, [options]) ⇒ <code>PromiseLike.&lt;HtmlElement&gt;</code>
Injects an image tag into the DOM

**Kind**: static method of [<code>AssetLoader</code>](#AssetLoader)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>String</code> |  | the url of the image |
| [options] | <code>Object</code> | <code>{}</code> | options for element creation |

<a name="AssetLoader.css"></a>

### AssetLoader.css(url, [options]) ⇒ <code>PromiseLike.&lt;HtmlElement&gt;</code>
Injects a stylesheet link tag into the DOM

**Kind**: static method of [<code>AssetLoader</code>](#AssetLoader)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>String</code> |  | the url of the stylesheet |
| [options] | <code>Object</code> | <code>{}</code> | options for element creation |

<a name="AssetLoader.stylesheet"></a>

### AssetLoader.stylesheet(url, [options]) ⇒ <code>PromiseLike.&lt;HtmlElement&gt;</code>
Injects a stylesheet link tag into the DOM

**Kind**: static method of [<code>AssetLoader</code>](#AssetLoader)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>String</code> |  | the url of the stylesheet |
| [options] | <code>Object</code> | <code>{}</code> | options for element creation |

<a name="AssetLoader.script"></a>

### AssetLoader.script(url, [options]) ⇒ <code>Promise.&lt;HTMLElement&gt;</code>
Injects a script tag into the DOM

**Kind**: static method of [<code>AssetLoader</code>](#AssetLoader)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>String</code> |  | the url of the stylesheet |
| [options] | <code>Object</code> | <code>{}</code> | options for element creation |
| [options.babel] | <code>Boolean</code> | <code>false</code> | add type=text/babel attribute, also fire a hack event to support lazy loading scripts |
| [options.delay] | <code>Number</code> | <code>400</code> | how long to wait until firing the fake DOMContentLoaded event to trick babel-standalone |

<a name="AssetLoader.unpkg"></a>

### AssetLoader.unpkg(dependencies, options) ⇒ <code>Object.&lt;String, Object&gt;</code>
Load assets from unpkg.com by name, will asynchronously load them
by injecting a script tag.  The Promise will resolve when the asset
has been loaded.

**Kind**: static method of [<code>AssetLoader</code>](#AssetLoader)  
**Returns**: <code>Object.&lt;String, Object&gt;</code> - returns an object whose keys are the global variable name, and whose values are the libraries that were injected  

| Param | Type | Description |
| --- | --- | --- |
| dependencies | <code>Object</code> | an object whose keys are the global variable name of the package, |
| options | <code>Object</code> | an options hash |
| options.protocol | <code>String</code> | http or https |

**Example**  
```js
runtime.assetLoader.unpkg({
   React: 'react@16.7.0/umd/react.production.min.js',
   ReactDOM: 'react-dom@16.7.0/umd/react-dom.production.min.js'
 })
```