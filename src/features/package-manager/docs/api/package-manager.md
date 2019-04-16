## Classes

<dl>
<dt><a href="#PackageManager">PackageManager</a></dt>
<dd><p>The PackageManager is a database that contains all of the package.json files found in the repository</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#remoteVersionMap">remoteVersionMap</a></dt>
<dd><p>Returns a table of all of the packages, their current version, and remote version</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#find">find(id)</a> ⇒ <code><a href="#PackageManifest">PackageManifest</a></code></dt>
<dd><p>Finds a package by its id, or name</p>
</dd>
<dt><a href="#findBy">findBy(iterator)</a> ⇒ <code><a href="#PackageManifest">PackageManifest</a></code></dt>
<dd><p>Finds a package by a function</p>
</dd>
<dt><a href="#findByName">findByName(name)</a></dt>
<dd><p>Finds a package by its name</p>
</dd>
<dt><a href="#findDependentsOf">findDependentsOf(packageName)</a> ⇒ <code>Object.&lt;String, PackageManifest&gt;</code></dt>
<dd><p>Find all dependents of a given package</p>
</dd>
<dt><a href="#pickAllBy">pickAllBy(pickBy)</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>For every package in the project, run the lodash pickBy function to get arbitrary attributes</p>
</dd>
<dt><a href="#pickAll">pickAll(...attributes)</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>For every package in the project, run the lodash pick function to get arbitrary attributes</p>
</dd>
<dt><a href="#pickAllRemotesBy">pickAllRemotesBy(pickBy)</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>For every package in the project, run the lodash pickBy function to get arbitrary attributes</p>
</dd>
<dt><a href="#pickAllRemotes">pickAllRemotes(...attributes)</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>For every package in the project, run the lodash pick function to get arbitrary attributes</p>
</dd>
<dt><a href="#listPackageContents">listPackageContents(packageName, options)</a></dt>
<dd><p>Uses npm-packlist to tell us everything in a project that will be published to npm</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#PackageManifest">PackageManifest</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#PackageId">PackageId</a> : <code>String</code></dt>
<dd></dd>
<dt><a href="#PackageManagerSnapshot">PackageManagerSnapshot</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#PackageGraph">PackageGraph</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="PackageManager"></a>

## PackageManager
The PackageManager is a database that contains all of the package.json files found in the repository

**Kind**: global class  

* [PackageManager](#PackageManager)
    * [.statuses](#PackageManager.statuses)
    * [.lifecycleHooks](#PackageManager.lifecycleHooks)
    * [.fileManager](#PackageManager.fileManager) : <code>FileManager</code>
    * [.finder](#PackageManager.finder) : <code>PackageFinder</code>
    * [.packageIds](#PackageManager.packageIds)
    * [.packageData](#PackageManager.packageData) : [<code>Array.&lt;PackageManifest&gt;</code>](#PackageManifest)
    * [.packageNames](#PackageManager.packageNames) : <code>Array.&lt;String&gt;</code>
    * [.entries](#PackageManager.entries) : <code>Array.&lt;Array&gt;</code>
    * [.byName](#PackageManager.byName) : <code>Object.&lt;String, PackageManifest&gt;</code>
    * [.remotesByName](#PackageManager.remotesByName) : <code>Object.&lt;String, PackageManifest&gt;</code>
    * [.packagesAhead](#PackageManager.packagesAhead)
    * [.unpublished](#PackageManager.unpublished)
    * [.packagesBehind](#PackageManager.packagesBehind)
    * [.remoteData](#PackageManager.remoteData) : [<code>Array.&lt;PackageManifest&gt;</code>](#PackageManifest)
    * [.remoteEntries](#PackageManager.remoteEntries) : <code>Array.&lt;Array&gt;</code>
    * [.dependenciesMap](#PackageManager.dependenciesMap)
    * [.startAsync([options])](#PackageManager.startAsync) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
    * [.start([options], cb)](#PackageManager.start) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
    * [.activationEventWasFired([options])](#PackageManager.activationEventWasFired) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
    * [.whenActivated([options])](#PackageManager.whenActivated) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
    * [.findNodeModules([options])](#PackageManager.findNodeModules) ⇒ <code>Promise.&lt;Array.&lt;PackageManifest&gt;&gt;</code>
    * [.selectPackageTree([options])](#PackageManager.selectPackageTree) ⇒ <code>Array.&lt;{name: string, tree: array, manifest: PackageManifest}&gt;</code>
    * [.exportGraph([options])](#PackageManager.exportGraph) ⇒ [<code>PackageGraph</code>](#PackageGraph)
    * [.selectModifiedPackages([options])](#PackageManager.selectModifiedPackages) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.createSnapshot([options])](#PackageManager.createSnapshot) ⇒ [<code>PackageManagerSnapshot</code>](#PackageManagerSnapshot)
    * [.calculatePackageHash(packageName, options)](#PackageManager.calculatePackageHash) ⇒ <code>String</code> \| <code>Object</code>

<a name="PackageManager.statuses"></a>

### PackageManager.statuses
Info about all the possible statuses the package manager can be in

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.lifecycleHooks"></a>

### PackageManager.lifecycleHooks
Information about the life cycle hooks emitted by the package manager

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.fileManager"></a>

### PackageManager.fileManager : <code>FileManager</code>
A reference to the FileManager feature

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.finder"></a>

### PackageManager.finder : <code>PackageFinder</code>
A reference to the PackageFinder feature

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.packageIds"></a>

### PackageManager.packageIds
Returns the ids of all the packages found.  The id is the relative path to the package.json

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
**Properties**

| Type |
| --- |
| [<code>Array.&lt;PackageId&gt;</code>](#PackageId) | 

<a name="PackageManager.packageData"></a>

### PackageManager.packageData : [<code>Array.&lt;PackageManifest&gt;</code>](#PackageManifest)
Returns all of the package manifests found.

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.packageNames"></a>

### PackageManager.packageNames : <code>Array.&lt;String&gt;</code>
Returns the names found in each manifest

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.entries"></a>

### PackageManager.entries : <code>Array.&lt;Array&gt;</code>
Returns each manifest as entries

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.byName"></a>

### PackageManager.byName : <code>Object.&lt;String, PackageManifest&gt;</code>
Returns an object of every package manifest keyed by name

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.remotesByName"></a>

### PackageManager.remotesByName : <code>Object.&lt;String, PackageManifest&gt;</code>
Returns an object of every remote package manifest keyed by name

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.packagesAhead"></a>

### PackageManager.packagesAhead
Returns the packages where the version in the local tree isn't published to npm

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.unpublished"></a>

### PackageManager.unpublished
Returns the packages who have a version number that doesn't exist in the npm registry

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.packagesBehind"></a>

### PackageManager.packagesBehind
Returns the packages in the local tree whose versions are behind what is on npm.

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.remoteData"></a>

### PackageManager.remoteData : [<code>Array.&lt;PackageManifest&gt;</code>](#PackageManifest)
Returns all of the package manifests found.

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.remoteEntries"></a>

### PackageManager.remoteEntries : <code>Array.&lt;Array&gt;</code>
Returns each remote manifest as entries

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.dependenciesMap"></a>

### PackageManager.dependenciesMap
Gets a map of packages and their dependents

**Kind**: static property of [<code>PackageManager</code>](#PackageManager)  
**Read only**: true  
<a name="PackageManager.startAsync"></a>

### PackageManager.startAsync([options]) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
Starts the PackageManager service, which scans the local project for any package.json manifests
and populates our manifests observable with the information

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.remote] | <code>Boolean</code> | <code>false</code> | whether to fetch the remote information about this package from npm |

<a name="PackageManager.start"></a>

### PackageManager.start([options], cb) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
Starts the package manager with the callback style

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.remote] | <code>Boolean</code> | <code>false</code> | whether to load remote repository information from npm |
| cb | <code>function</code> |  |  |

<a name="PackageManager.activationEventWasFired"></a>

### PackageManager.activationEventWasFired([options]) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
Returns a promise which resolves when the package manager is finally activated.

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | 
| [options.timeout] | <code>Number</code> | <code>30000</code> | 

<a name="PackageManager.whenActivated"></a>

### PackageManager.whenActivated([options]) ⇒ [<code>Promise.&lt;PackageManager&gt;</code>](#PackageManager)
Returns a promise which will resolve when the package manager is finally activated.  If it hasn't yet
been started, this will start it.

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | 

<a name="PackageManager.findNodeModules"></a>

### PackageManager.findNodeModules([options]) ⇒ <code>Promise.&lt;Array.&lt;PackageManifest&gt;&gt;</code>
Find node module packages using the PackageFnder

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | options for the packageFinder.find method |

<a name="PackageManager.selectPackageTree"></a>

### PackageManager.selectPackageTree([options]) ⇒ <code>Array.&lt;{name: string, tree: array, manifest: PackageManifest}&gt;</code>
Selects all of the files in the FileManager that live underneath a given package folder

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>\*</code> | <code>{}</code> | 

<a name="PackageManager.exportGraph"></a>

### PackageManager.exportGraph([options]) ⇒ [<code>PackageGraph</code>](#PackageGraph)
Exports nodes and edges for use in a graph visualization

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | 

<a name="PackageManager.selectModifiedPackages"></a>

### PackageManager.selectModifiedPackages([options]) ⇒ <code>Promise.&lt;Array&gt;</code>
Returns all of the packages who have modifications in their tree

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | 

<a name="PackageManager.createSnapshot"></a>

### PackageManager.createSnapshot([options]) ⇒ [<code>PackageManagerSnapshot</code>](#PackageManagerSnapshot)
Creates a JSON snapshot of all of the package manifests,
along with additional metadata

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>\*</code> | <code>{}</code> | 

<a name="PackageManager.calculatePackageHash"></a>

### PackageManager.calculatePackageHash(packageName, options) ⇒ <code>String</code> \| <code>Object</code>
Uses npm-packlist to build the list of files that will be published to npm,
calculates an md5 hash of the contents of each of the files listed, and then
sorts them by the filename.  Creates a hash of that unique set of objects, to
come up with a unique hash for the package source that is being released.

**Kind**: static method of [<code>PackageManager</code>](#PackageManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| packageName | <code>String</code> |  |  |
| options | <code>Object</code> |  |  |
| [options.compress] | <code>Boolean</code> | <code>true</code> | compress all the hashes into a single hash string value, setting to false will show the individual hashes of every file |

<a name="remoteVersionMap"></a>

## remoteVersionMap
Returns a table of all of the packages, their current version, and remote version

**Kind**: global variable  
<a name="find"></a>

## find(id) ⇒ [<code>PackageManifest</code>](#PackageManifest)
Finds a package by its id, or name

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | the package id, or name |

<a name="findBy"></a>

## findBy(iterator) ⇒ [<code>PackageManifest</code>](#PackageManifest)
Finds a package by a function

**Kind**: global function  

| Param | Type |
| --- | --- |
| iterator | <code>function</code> | 

<a name="findByName"></a>

## findByName(name)
Finds a package by its name

**Kind**: global function  

| Param | Type |
| --- | --- |
| name | <code>String</code> | 

<a name="findDependentsOf"></a>

## findDependentsOf(packageName) ⇒ <code>Object.&lt;String, PackageManifest&gt;</code>
Find all dependents of a given package

**Kind**: global function  

| Param | Type |
| --- | --- |
| packageName | <code>String</code> | 

<a name="pickAllBy"></a>

## pickAllBy(pickBy) ⇒ <code>Array.&lt;Object&gt;</code>
For every package in the project, run the lodash pickBy function to get arbitrary attributes

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pickBy | <code>function</code> | function which will get passed (value, key) |

<a name="pickAll"></a>

## pickAll(...attributes) ⇒ <code>Array.&lt;Object&gt;</code>
For every package in the project, run the lodash pick function to get arbitrary attributes

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...attributes | <code>String</code> | list of attribute keys to pull from the package |

<a name="pickAllRemotesBy"></a>

## pickAllRemotesBy(pickBy) ⇒ <code>Array.&lt;Object&gt;</code>
For every package in the project, run the l