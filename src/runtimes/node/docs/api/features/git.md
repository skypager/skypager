<a name="GitFeature"></a>

## GitFeature
The Git Feature provides an interface for real time status about the git tree,
including all of the files and their current status, as well as information about the current branch,
sha, tag, etc.

**Kind**: global class  

* [GitFeature](#GitFeature)
    * [.statusMap](#GitFeature.statusMap) : <code>Map</code>
    * [.files](#GitFeature.files) : <code>Map</code>
    * [.directories](#GitFeature.directories) : <code>Map</code>
    * [.fileIds](#GitFeature.fileIds) : <code>Array.&lt;String&gt;</code>
    * [.directoryIds](#GitFeature.directoryIds) : <code>Array.&lt;String&gt;</code>
    * [.isDirty](#GitFeature.isDirty)
    * [.modifiedFiles](#GitFeature.modifiedFiles) : <code>Array.&lt;String&gt;</code>
    * [.clone(options, destination)](#GitFeature.clone)
    * [.run(options)](#GitFeature.run)
    * [.toJSON()](#GitFeature.toJSON) ⇒ <code>Object</code>
    * [.exists(path)](#GitFeature.exists) ⇒ <code>Boolean</code>
    * [.walker()](#GitFeature.walker) ⇒ <code>PromiseLike.&lt;Skywalker&gt;</code>
    * [.updateStatus()](#GitFeature.updateStatus)
    * [.walk(options)](#GitFeature.walk)
    * [.filesStatus()](#GitFeature.filesStatus) ⇒ <code>Object.&lt;string, Array.&lt;string&gt;&gt;</code>
    * [.lsFiles(options)](#GitFeature.lsFiles)
    * [.findRepo()](#GitFeature.findRepo) ⇒ <code>String</code>

<a name="GitFeature.statusMap"></a>

### GitFeature.statusMap : <code>Map</code>
Returns a map of the files and their git status

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.files"></a>

### GitFeature.files : <code>Map</code>
Returns a map of files

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.directories"></a>

### GitFeature.directories : <code>Map</code>
Returns a map of directories

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.fileIds"></a>

### GitFeature.fileIds : <code>Array.&lt;String&gt;</code>
Returns an array of file ids from the files map

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.directoryIds"></a>

### GitFeature.directoryIds : <code>Array.&lt;String&gt;</code>
Returns an array of directory ids from the directories map

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.isDirty"></a>

### GitFeature.isDirty
Returns true if there are any dirty files

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.modifiedFiles"></a>

### GitFeature.modifiedFiles : <code>Array.&lt;String&gt;</code>
Returns an array of files that have been modified

**Kind**: static property of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.clone"></a>

### GitFeature.clone(options, destination)
Clone a repository.

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> \| <code>String</code> | or repo path if a string |
| options.repo | <code>String</code> | the url of the repo you want to clone |
| options.folder | <code>String</code> | the folder you want to clone into |
| destination | <code>Object</code> \| <code>string</code> | the destination path |

<a name="GitFeature.run"></a>

### GitFeature.run(options)
Begin the stateful process of tracking the files with git

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | options which will be passed on to walk, and update status |
| [options.clear] | <code>Boolean</code> | <code>false</code> | clear the current state |

<a name="GitFeature.toJSON"></a>

### GitFeature.toJSON() ⇒ <code>Object</code>
Dump the files directories and status objects to a JSON structure

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.exists"></a>

### GitFeature.exists(path) ⇒ <code>Boolean</code>
Returns true if a file exists in the tree

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  

| Param | Type |
| --- | --- |
| path | <code>String</code> | 

<a name="GitFeature.walker"></a>

### GitFeature.walker() ⇒ <code>PromiseLike.&lt;Skywalker&gt;</code>
Creates a walker that will walk the files tree built by ls-files
and receive file and directory objects it finds, populating these
maps with information about the file stats, parsed path info, etc

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.updateStatus"></a>

### GitFeature.updateStatus()
Updates the observable files map with status information from the git status map

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.walk"></a>

### GitFeature.walk(options)
Uses git ls-files to learn about all of the files in the tree,
populates the files and directories map with any information about the files it finds.

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | options for the walker behavior, same as lsFiles options |

<a name="GitFeature.filesStatus"></a>

### GitFeature.filesStatus() ⇒ <code>Object.&lt;string, Array.&lt;string&gt;&gt;</code>
Returns the git status for any files that have been changed

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  
<a name="GitFeature.lsFiles"></a>

### GitFeature.lsFiles(options)
Run git ls-files to get a list of files in the tree

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | options for the ls-files command |
| [options.cwd] | <code>String</code> |  | the current working path to run the command in |
| [options.fullName] | <code>Boolean</code> | <code>false</code> |  |
| [options.status] | <code>Boolean</code> | <code>false</code> | include the status in the output |
| [options.others] | <code>Boolean</code> | <code>true</code> | include other files |
| [options.cached] | <code>Boolean</code> | <code>true</code> | include cached files |
| [options.maxBuffer] | <code>Number</code> | <code>1024*1024</code> | the maxBuffer, for large git repos this needs to be bigger.  this comes from process.env.SKYPAGER_GIT_MAX_OUTPUT_BUFFER |
| [options.skypagerignore] | <code>Boolean</code> | <code>false</code> | include patterns found in the .skypagerignore file if it exists |
| [options.exclude] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | patterns to exclude |

<a name="GitFeature.findRepo"></a>

### GitFeature.findRepo() ⇒ <code>String</code>
Find the nearest git repo by walking up the tree from cwd

**Kind**: static method of [<code>GitFeature</code>](#GitFeature)