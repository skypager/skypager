<a name="Directory"></a>

## Directory
The Directory is a searchable registry

**Kind**: global class  
<a name="new_Directory_new"></a>

### new exports.Directory(name, options, route)
Create a new Simple Registry


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The name of this registry |
| options | <code>Object</code> | =             {} Options |
| options.init | <code>function</code> | a function which will be called with the registry after it is initialize. |
| options.fallback | <code>function</code> | called whenever an invalid lookup request returns |
| route | <code>String</code> | an express or path-to-regexp style route which turns the id into metadata |