## Classes

<dl>
<dt><a href="#ChildProcessAdapter">ChildProcessAdapter</a></dt>
<dd><p>provides some utility functions for spawning processes based on top of child_process and child-process-promise.
The functions are always defaulting to use the cwd of the host runtime that is using them.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AsyncProcInterface">AsyncProcInterface</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="ChildProcessAdapter"></a>

## ChildProcessAdapter
provides some utility functions for spawning processes based on top of child_process and child-process-promise.
The functions are always defaulting to use the cwd of the host runtime that is using them.

**Kind**: global class  

* [ChildProcessAdapter](#ChildProcessAdapter)
    * [.async](#ChildProcessAdapter.async) : [<code>AsyncProcInterface</code>](#AsyncProcInterface)
    * [.spawnAndCapture(spawnOptions, options)](#ChildProcessAdapter.spawnAndCapture)
    * [.exec(cmd, options, ...args)](#ChildProcessAdapter.exec)
    * [.execFile(cmd, argv, options)](#ChildProcessAdapter.execFile)
    * [.spawn(cmd, argv, options)](#ChildProcessAdapter.spawn)
    * [.fork(cmd, argv, options)](#ChildProcessAdapter.fork)
    * [.execFileSync(cmd, argv, options)](#ChildProcessAdapter.execFileSync)
    * [.execSync(cmd, options, ...args)](#ChildProcessAdapter.execSync)
    * [.spawnSync(cmd, argv, options, ...args)](#ChildProcessAdapter.spawnSync)
    * [.forkSync(cmd, argv, options, ...args)](#ChildProcessAdapter.forkSync)

<a name="ChildProcessAdapter.async"></a>

### ChildProcessAdapter.async : [<code>AsyncProcInterface</code>](#AsyncProcInterface)
**Kind**: static property of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  
<a name="ChildProcessAdapter.spawnAndCapture"></a>

### ChildProcessAdapter.spawnAndCapture(spawnOptions, options)
asynchronously Spawn a process and capture the output as it runs.

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| spawnOptions | <code>Object</code> | options to pass to the spawn function |
| options.cmd | <code>String</code> | the process to run |
| options.args | <code>Array.&lt;String&gt;</code> | an array of arguments to pass tot he process |
| options.options | <code>Object.&lt;string, any&gt;</code> | options to pass to spawn |
| options | <code>Object</code> | options for the behavior of capture |
| options.onErrorOutput | <code>function</code> | a function which will be continulally passed error output as a string as it is received, and information about the process |
| options.onOutput | <code>function</code> | a function which will be continually passed normal output as a string as it is received, and information about the process |

<a name="ChildProcessAdapter.exec"></a>

### ChildProcessAdapter.exec(cmd, options, ...args)
A wrapper around child_process.exec that sets the cwd to the same as the host runtime

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| cmd | <code>String</code> | the command you wish to execute |
| options | <code>Object</code> | options to pass to child_process.exec |
| ...args | <code>\*</code> | args that get passed through |

<a name="ChildProcessAdapter.execFile"></a>

### ChildProcessAdapter.execFile(cmd, argv, options)
Perform a child_process execFile

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| argv | <code>Array</code> | 
| options | <code>Object</code> | 

<a name="ChildProcessAdapter.spawn"></a>

### ChildProcessAdapter.spawn(cmd, argv, options)
Perform a child_process spawn

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| argv | <code>Array</code> | 
| options | <code>Object</code> | 

<a name="ChildProcessAdapter.fork"></a>

### ChildProcessAdapter.fork(cmd, argv, options)
Perform a child_process fork

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| argv | <code>Array</code> | 
| options | <code>Object</code> | 

<a name="ChildProcessAdapter.execFileSync"></a>

### ChildProcessAdapter.execFileSync(cmd, argv, options)
Perform a child_process execFileSync

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| argv | <code>Array</code> | 
| options | <code>Object</code> | 

<a name="ChildProcessAdapter.execSync"></a>

### ChildProcessAdapter.execSync(cmd, options, ...args)
Perform a child_process.execSync

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| options | <code>Object</code> | 
| ...args | <code>\*</code> | 

<a name="ChildProcessAdapter.spawnSync"></a>

### ChildProcessAdapter.spawnSync(cmd, argv, options, ...args)
Perform a child_process.spawnSync

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| argv | <code>Array</code> | 
| options | <code>Object</code> | 
| ...args | <code>\*</code> | 

<a name="ChildProcessAdapter.forkSync"></a>

### ChildProcessAdapter.forkSync(cmd, argv, options, ...args)
Perform a child_process.forkSync

**Kind**: static method of [<code>ChildProcessAdapter</code>](#ChildProcessAdapter)  

| Param | Type |
| --- | --- |
| cmd | <code>String</code> | 
| argv | <code>Array</code> | 
| options | <code>Object</code> | 
| ...args | <code>\*</code> | 

<a name="AsyncProcInterface"></a>

## AsyncProcInterface : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| spawn | <code>function</code> | 
| execFile | <code>function</code> | 
| fork | <code>function</code> | 
| exec | <code>function</code> |