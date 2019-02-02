## Members

<dl>
<dt><a href="#PATH_REGEXP">PATH_REGEXP</a> : <code>RegExp</code></dt>
<dd><p>The main path matching regexp utility.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#parse">parse(str, [options])</a> ⇒ <code>Array</code></dt>
<dd><p>Parse a string for the raw tokens.</p>
</dd>
<dt><a href="#compile">compile(str, [options])</a> ⇒ <code>function</code></dt>
<dd><p>Compile a string to a template function for the path.</p>
</dd>
<dt><a href="#encodeURIComponentPretty">encodeURIComponentPretty(str)</a> ⇒ <code>string</code></dt>
<dd><p>Prettier encoding of URI path segments.</p>
</dd>
<dt><a href="#encodeAsterisk">encodeAsterisk(str)</a> ⇒ <code>string</code></dt>
<dd><p>Encode the asterisk parameter. Similar to <code>pretty</code>, but allows slashes.</p>
</dd>
<dt><a href="#tokensToFunction">tokensToFunction()</a></dt>
<dd><p>Expose a method for transforming tokens into the path function.</p>
</dd>
<dt><a href="#escapeString">escapeString(str)</a> ⇒ <code>string</code></dt>
<dd><p>Escape a regular expression string.</p>
</dd>
<dt><a href="#escapeGroup">escapeGroup(group)</a> ⇒ <code>string</code></dt>
<dd><p>Escape the capturing group by escaping special characters and meaning.</p>
</dd>
<dt><a href="#attachKeys">attachKeys(re, keys)</a> ⇒ <code>RegExp</code></dt>
<dd><p>Attach the keys as a property of the regexp.</p>
</dd>
<dt><a href="#flags">flags(options)</a> ⇒ <code>string</code></dt>
<dd><p>Get the flags for a regexp from the options.</p>
</dd>
<dt><a href="#regexpToRegexp">regexpToRegexp(path, keys)</a> ⇒ <code>RegExp</code></dt>
<dd><p>Pull out keys from a regexp.</p>
</dd>
<dt><a href="#arrayToRegexp">arrayToRegexp(path, keys, options)</a> ⇒ <code>RegExp</code></dt>
<dd><p>Transform an array into a regexp.</p>
</dd>
<dt><a href="#stringToRegexp">stringToRegexp(path, keys, options)</a> ⇒ <code>RegExp</code></dt>
<dd><p>Create a path regexp from string input.</p>
</dd>
<dt><a href="#tokensToRegExp">tokensToRegExp(tokens, [keys], [options])</a> ⇒ <code>RegExp</code></dt>
<dd><p>Expose a function for taking tokens and returning a RegExp.</p>
</dd>
<dt><a href="#pathToRegexp">pathToRegexp(path, [keys], [options])</a> ⇒ <code>RegExp</code></dt>
<dd><p>Normalize the given path string, returning a regular expression.</p>
<p>An empty array can be passed in for the keys, which will hold the
placeholder key descriptions. For example, using <code>/user/:id</code>, <code>keys</code> will
contain <code>[{ name: &#39;id&#39;, delimiter: &#39;/&#39;, optional: false, repeat: false }]</code>.</p>
</dd>
</dl>

<a name="PATH_REGEXP"></a>

## PATH\_REGEXP : <code>RegExp</code>
The main path matching regexp utility.

**Kind**: global variable  
<a name="parse"></a>

## parse(str, [options]) ⇒ <code>Array</code>
Parse a string for the raw tokens.

**Kind**: global function  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 
| [options] | <code>Object</code> | 

<a name="compile"></a>

## compile(str, [options]) ⇒ <code>function</code>
Compile a string to a template function for the path.

**Kind**: global function  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 
| [options] | <code>Object</code> | 

<a name="encodeURIComponentPretty"></a>

## encodeURIComponentPretty(str) ⇒ <code>string</code>
Prettier encoding of URI path segments.

**Kind**: global function  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 

<a name="encodeAsterisk"></a>

## encodeAsterisk(str) ⇒ <code>string</code>
Encode the asterisk parameter. Similar to `pretty`, but allows slashes.

**Kind**: global function  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 

<a name="tokensToFunction"></a>

## tokensToFunction()
Expose a method for transforming tokens into the path function.

**Kind**: global function  
<a name="escapeString"></a>

## escapeString(str) ⇒ <code>string</code>
Escape a regular expression string.

**Kind**: global function  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 

<a name="escapeGroup"></a>

## escapeGroup(group) ⇒ <code>string</code>
Escape the capturing group by escaping special characters and meaning.

**Kind**: global function  

| Param | Type |
| --- | --- |
| group | <code>string</code> | 

<a name="attachKeys"></a>

## attachKeys(re, keys) ⇒ <code>RegExp</code>
Attach the keys as a property of the regexp.

**Kind**: global function  

| Param | Type |
| --- | --- |
| re | <code>RegExp</code> | 
| keys | <code>Array</code> | 

<a name="flags"></a>

## flags(options) ⇒ <code>string</code>
Get the flags for a regexp from the options.

**Kind**: global function  

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 

<a name="regexpToRegexp"></a>

## regexpToRegexp(path, keys) ⇒ <code>RegExp</code>
Pull out keys from a regexp.

**Kind**: global function  

| Param | Type |
| --- | --- |
| path | <code>RegExp</code> | 
| keys | <code>Array</code> | 

<a name="arrayToRegexp"></a>

## arrayToRegexp(path, keys, options) ⇒ <code>RegExp</code>
Transform an array into a regexp.

**Kind**: global function  

| Param | Type |
| --- | --- |
| path | <code>Array</code> | 
| keys | <code>Array</code> | 
| options | <code>Object</code> | 

<a name="stringToRegexp"></a>

## stringToRegexp(path, keys, options) ⇒ <code>RegExp</code>
Create a path regexp from string input.

**Kind**: global function  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| keys | <code>Array</code> | 
| options | <code>Object</code> | 

<a name="tokensToRegExp"></a>

## tokensToRegExp(tokens, [keys], [options]) ⇒ <code>RegExp</code>
Expose a function for taking tokens and returning a RegExp.

**Kind**: global function  

| Param | Type |
| --- | --- |
| tokens | <code>Array</code> | 
| [keys] | <code>Array</code> \| <code>Object</code> | 
| [options] | <code>Object</code> | 

<a name="pathToRegexp"></a>

## pathToRegexp(path, [keys], [options]) ⇒ <code>RegExp</code>
Normalize the given path string, returning a regular expression.

An empty array can be passed in for the keys, which will hold the
placeholder key descriptions. For example, using `/user/:id`, `keys` will
contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.

**Kind**: global function  

| Param | Type |
| --- | --- |
| path | <code>string</code> \| <code>RegExp</code> \| <code>Array</code> | 
| [keys] | <code>Array</code> \| <code>Object</code> | 
| [options] | <code>Object</code> |