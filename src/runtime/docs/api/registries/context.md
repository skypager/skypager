<a name="RequireContext"></a>

## RequireContext
Wraps a particular type of webpack require context with a custom
API for using the modules it contains for their intended purpose.

**Kind**: global class  
<a name="new_RequireContext_new"></a>

### new exports.RequireContext(webpackRequireContext, options)
Wrap one of webpack's require.context objects in your own custom object to provide
a DSL for working with that group of modules.


| Param | Type | Description |
| --- | --- | --- |
| webpackRequireContext | <code>Context</code> | the result of a require.context call made inside a webpack compilation |
| options | <code>Object</code> |  |
| options.prefix | <code>String</code> | a prefix that will be discarded when coming up with a humanized id for the module |