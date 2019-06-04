## Classes

<dl>
<dt><a href="#BabelCompiler">BabelCompiler</a> ⇐ <code>Feature</code></dt>
<dd><p>loads the babel standalone library from a CDN and provides a way to run code written with the latest features
directly in the browser.  Can be used to power editable code blocks that contain JSX for example, and render the output as
the editor is saved.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#createCodeRunner">createCodeRunner(code, options, context)</a> ⇒ <code>function</code></dt>
<dd></dd>
</dl>

<a name="BabelCompiler"></a>

## BabelCompiler ⇐ <code>Feature</code>
loads the babel standalone library from a CDN and provides a way to run code written with the latest features
directly in the browser.  Can be used to power editable code blocks that contain JSX for example, and render the output as
the editor is saved.

**Kind**: global class  
**Extends**: <code>Feature</code>  

* [BabelCompiler](#BabelCompiler) ⇐ <code>Feature</code>
    * [.vm](#BabelCompiler.vm)
    * [.compile(code, [options])](#BabelCompiler.compile) ⇒ <code>String</code>
    * [.whenReady([fn])](#BabelCompiler.whenReady) ⇒ <code>PromiseLike</code>

<a name="BabelCompiler.vm"></a>

### BabelCompiler.vm
**Kind**: static property of [<code>BabelCompiler</code>](#BabelCompiler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| vm | <code>Object</code> | the vm module interface |

<a name="BabelCompiler.compile"></a>

### BabelCompiler.compile(code, [options]) ⇒ <code>String</code>
Compile es6 code with babel

**Kind**: static method of [<code>BabelCompiler</code>](#BabelCompiler)  
**Returns**: <code>String</code> - the compiled code  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>String</code> |  |  |
| [options] | <code>Object</code> | <code>{}</code> | options to pass to babel |

<a name="BabelCompiler.whenReady"></a>

### BabelCompiler.whenReady([fn]) ⇒ <code>PromiseLike</code>
Waits until Babel standalone compiler is available

**Kind**: static method of [<code>BabelCompiler</code>](#BabelCompiler)  

| Param | Type | Description |
| --- | --- | --- |
| [fn] | <code>function</code> | use a callback style, omitting this value will return a promise |

<a name="createCodeRunner"></a>

## createCodeRunner(code, options, context) ⇒ <code>function</code>
**Kind**: global function  
**Returns**: <code>function</code> - a function which will compile your code and run it in a sandbox. This function accepts an object which will be added to the sandbox scope  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>String</code> | the code you wish to compile a sandbox |
| options | <code>Object</code> | options for the code runner |
| context | <code>Object</code> | things to inject into the context |

**Example**  
```js
const babel = runtime.feature('babel')
const runner = babel.createCodeRunner(`console.log(myVar)`)

runner({ myVar: 1 }).then((result) => {
  console.log(result)
})
```