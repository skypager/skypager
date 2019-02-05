<a name="Helper"></a>

## Helper
Helpers act as a registry for specific types of Javascript modules
             that are to be made available to a project runtime.  Helpers exist to provide
             common behavior, interfaces, and life cycle events and hooks for all types of things
             such as servers, compilers, commands, or anything else that can be categorized and grouped.
             Helpers are designed to be shared across multiple projects, and there are event Project Type helpers
             which exist to make specific types of helpers available to specific types of projects.

**Kind**: global class  

* [Helper](#Helper)
    * _instance_
        * [.providerTypes](#Helper+providerTypes)
        * [.optionTypes](#Helper+optionTypes)
        * [.contextTypes](#Helper+contextTypes)
        * [.providerTypes](#Helper+providerTypes)
        * [.optionTypes](#Helper+optionTypes)
        * [.contextTypes](#Helper+contextTypes)
        * [.projectSettingsPaths](#Helper+projectSettingsPaths)
        * [.doInitialize()](#Helper+doInitialize)
        * [.tryGet()](#Helper+tryGet)
        * [.tryResult()](#Helper+tryResult)
    * _static_
        * [.attach()](#Helper.attach)

<a name="Helper+providerTypes"></a>

### helper.providerTypes
Helper classes can specify attributes that individual helper modules are
expected to provide or export.

**Kind**: instance property of [<code>Helper</code>](#Helper)  
<a name="Helper+optionTypes"></a>

### helper.optionTypes
Helper classes can specify options or parameters that can be passed in at the time
the helper instance is created.

**Kind**: instance property of [<code>Helper</code>](#Helper)  
<a name="Helper+contextTypes"></a>

### helper.contextTypes
Helpers are always passed a context property from the host project or runtime's sandbox,
this will include a reference to the host project, as well as the registry the helper belongs to
and things such as the environment or process argv.

**Kind**: instance property of [<code>Helper</code>](#Helper)  
<a name="Helper+providerTypes"></a>

### helper.providerTypes
Individual helper modules can reference the provdier type configuration from their constructor, and can override
them by passing in a providerTypes object in their options, by exporting a providerTypes object themselves.

**Kind**: instance property of [<code>Helper</code>](#Helper)  
<a name="Helper+optionTypes"></a>

### helper.optionTypes
Individual helper modules can reference the options type configuration from their constructor, and can override
them by passing in optionTypes object in their options, by exporting a optionTypes object themselves.

**Kind**: instance property of [<code>Helper</code>](#Helper)  
<a name="Helper+contextTypes"></a>

### helper.contextTypes
Individual helper modules can reference the context type configuration from their constructor, and can override
them by passing in a contextTypes object in their options, by exporting a contextTypes object themselves.

**Kind**: instance property of [<code>Helper</code>](#Helper)  
<a name="Helper+projectSettingsPaths"></a>

### helper.projectSettingsPaths
The object search paths where we look for settings and configuration

**Kind**: instance property of [<code>Helper</code>](#Helper)  
**Read only**: true  
<a name="Helper+doInitialize"></a>

### helper.doInitialize()
**Kind**: instance method of [<code>Helper</code>](#Helper)  
<a name="Helper+tryGet"></a>

### helper.tryGet()
Access the first value we find in our options hash in our provider hash

**Kind**: instance method of [<code>Helper</code>](#Helper)  
<a name="Helper+tryResult"></a>

### helper.tryResult()
Access the first value we find in our options hash in our provider hash

If the method is a function, it will be called in the scope of the helper,
with the helpers options and context

**Kind**: instance method of [<code>Helper</code>](#Helper)  
<a name="Helper.attach"></a>

### Helper.attach()
A Helper class is attached to a host.

**Kind**: static method of [<code>Helper</code>](#Helper)