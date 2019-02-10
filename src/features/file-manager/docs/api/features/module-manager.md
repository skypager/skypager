<a name="ModuleManager"></a>

## ModuleManager
The ModuleManager provides a database like API on top of the package.json found in the NODE_MODULES resolution path of the project

**Kind**: global class  

* [ModuleManager](#ModuleManager)
    * [.packageIds](#ModuleManager.packageIds) : <code>Array.&lt;String&gt;</code>
    * [.latestPackages](#ModuleManager.latestPackages) : <code>Array.&lt;PackageManifest&gt;</code>
    * [.packageData](#ModuleManager.packageData) : <code>Array.&lt;PackageManifest&gt;</code>
    * [.packageNames](#ModuleManager.packageNames)
    * [.entries](#ModuleManager.entries) : <code>Array.&lt;Array&gt;</code>

<a name="ModuleManager.packageIds"></a>

### ModuleManager.packageIds : <code>Array.&lt;String&gt;</code>
An array of the module ids found in the module manager

**Kind**: static property of [<code>ModuleManager</code>](#ModuleManager)  
**Read only**: true  
<a name="ModuleManager.latestPackages"></a>

### ModuleManager.latestPackages : <code>Array.&lt;PackageManifest&gt;</code>
Gets the latests manifest for each package in the module manager

**Kind**: static property of [<code>ModuleManager</code>](#ModuleManager)  
**Read only**: true  
<a name="ModuleManager.packageData"></a>

### ModuleManager.packageData : <code>Array.&lt;PackageManifest&gt;</code>
Gets every manifest for every package, including multiple versions, found in the NODE_MODULES resolution paths

**Kind**: static property of [<code>ModuleManager</code>](#ModuleManager)  
**Read only**: true  
<a name="ModuleManager.packageNames"></a>

### ModuleManager.packageNames
A unique list of all names of packages found in the module manager

**Kind**: static property of [<code>ModuleManager</code>](#ModuleManager)  
**Read only**: true  
<a name="ModuleManager.entries"></a>

### ModuleManager.entries : <code>Array.&lt;Array&gt;</code>
Gets all of the module manager manifests in entries form

**Kind**: static property of [<code>ModuleManager</code>](#ModuleManager)  
**Read only**: true