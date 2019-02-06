<a name="module_@skypager/node"></a>

## @skypager/node
require the @skypager/node module to get access to the skypager node runtime


* [@skypager/node](#module_@skypager/node)
    * [module.exports](#exp_module_@skypager/node--module.exports) : <code>NodeRuntime</code> ⏏
        * [~Runtime](#module_@skypager/node--module.exports..Runtime)
        * [~NodeRuntime](#module_@skypager/node--module.exports..NodeRuntime)

<a name="exp_module_@skypager/node--module.exports"></a>

### module.exports : <code>NodeRuntime</code> ⏏
**Kind**: Exported member  
**Extends**: <code>Runtime</code>  
<a name="module_@skypager/node--module.exports..Runtime"></a>

#### module.exports~Runtime
**Kind**: inner typedef of [<code>module.exports</code>](#exp_module_@skypager/node--module.exports)  
**Properties**

| Name | Type |
| --- | --- |
| start | <code>function</code> | 
| features | <code>Object</code> | 
| feature | <code>function</code> | 

<a name="module_@skypager/node--module.exports..NodeRuntime"></a>

#### module.exports~NodeRuntime
**Kind**: inner typedef of [<code>module.exports</code>](#exp_module_@skypager/node--module.exports)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| git | <code>GitFeature</code> | interact with git |
| fsx | <code>FileSystemFeature</code> | interact with a file system |
| proc | <code>ChildProcessAdapter</code> | interact with child processes |
| packageCache | <code>PackageCacheFeature</code> | interact with a cache store for selectors |
| opener | <code>OpenerFeature</code> | open files and urls on the local machine |
| mainScript | <code>MainScriptFeature</code> | interact with project specific main script for setup and customization |