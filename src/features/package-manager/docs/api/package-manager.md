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
<dt><a href="#findDependentsOf">findDependentsOf(packageName, options)</a> ⇒ <code>Object.&lt;String, PackageManifest&gt;</code> | <code>Array.&lt;String&gt;</code></dt>
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
<dt><a href="#showLastModified">showLastModified(options)</a></dt>
<dd><p>Returns an index of all of the package names and their last modified timestamps</p>
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
    * [.selectModifiedPackages([options], [dependents])](#PackageManager.selectModifiedPackages) ⇒ <code>Promise.&lt;Array&gt;</code>
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

**Kind**: static property o