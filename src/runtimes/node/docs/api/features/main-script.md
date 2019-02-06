<a name="MainScriptFeature"></a>

## MainScriptFeature
Loads a configured main script for the skypager project, configured in the package.json skypager.main property.
This script will be run in the context of the runtime's sandbox, and can export a module with attach and start functions that
will be called asycnhronously.

**Kind**: global class  

* [MainScriptFeature](#MainScriptFeature)
    * [.mainExports](#MainScriptFeature.mainExports)
    * [.skypagerMainPath](#MainScriptFeature.skypagerMainPath)
    * [.mainScriptExists](#MainScriptFeature.mainScriptExists)
    * [.whenReady()](#MainScriptFeature.whenReady) ⇒ <code>PromiseLike</code>

<a name="MainScriptFeature.mainExports"></a>

### MainScriptFeature.mainExports
Returns whatever the main script exports, if anything

**Kind**: static property of [<code>MainScriptFeature</code>](#MainScriptFeature)  
**Read only**: true  
<a name="MainScriptFeature.skypagerMainPath"></a>

### MainScriptFeature.skypagerMainPath
Returns the path to the main script

**Kind**: static property of [<code>MainScriptFeature</code>](#MainScriptFeature)  
**Read only**: true  
<a name="MainScriptFeature.mainScriptExists"></a>

### MainScriptFeature.mainScriptExists
Returns true if a file exists at the main script path

**Kind**: static property of [<code>MainScriptFeature</code>](#MainScriptFeature)  
**Read only**: true  
<a name="MainScriptFeature.whenReady"></a>

### MainScriptFeature.whenReady() ⇒ <code>PromiseLike</code>
Resolves when the main script has been loaded and applied

**Kind**: static method of [<code>MainScriptFeature</code>](#MainScriptFeature)