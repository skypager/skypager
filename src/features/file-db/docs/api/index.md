<a name="FileDbFeature"></a>

## FileDbFeature ⇐ <code>Feature</code>
**Kind**: global class  
**Extends**: <code>Feature</code>  
**Export**:   

* [FileDbFeature](#FileDbFeature) ⇐ <code>Feature</code>
    * [new FileDbFeature()](#new_FileDbFeature_new)
    * [.ensureIndex(fieldName, options)](#FileDbFeature+ensureIndex)
    * [.removeIndex(fieldName)](#FileDbFeature+removeIndex)

<a name="new_FileDbFeature_new"></a>

### new FileDbFeature()
The Browser VM Feature provides a JSDOM sandbox that lets you use the runtime.vm as if it was really inside a browser.

This lets you run browser scripts in node, for testing, server rendering, whatever.

<a name="FileDbFeature+ensureIndex"></a>

### fileDbFeature.ensureIndex(fieldName, options)
**Kind**: instance method of [<code>FileDbFeature</code>](#FileDbFeature)  

| Param | Type | Default |
| --- | --- | --- |
| fieldName | <code>String</code> |  | 
| options | <code>Object</code> |  | 
| [options.unique] | <code>Boolean</code> | <code>false</code> | 
| [options.sparse] | <code>Boolean</code> | <code>false</code> | 

<a name="FileDbFeature+removeIndex"></a>

### fileDbFeature.removeIndex(fieldName)
**Kind**: instance method of [<code>FileDbFeature</code>](#FileDbFeature)  

| Param | Type | Description |
| --- | --- | --- |
| fieldName | <code>String</code> | the field name whose index you want to remove |