## Classes

<dl>
<dt><a href="#ChildProcessAdapter">ChildProcessAdapter</a></dt>
<dd><p>provides some utility functions for spawning processes based on top of child_process and child-process-promise.
The functions are always defaulting to use the cwd of the host runtime that is using them.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#spawnAndCapture">spawnAndCapture(spawnOptions, options)</a></dt>
<dd><p>asynchronously Spawn a process and capture the output as it runs.</p>
</dd>
<dt><a href="#exec">exec(cmd, options, ...args)</a></dt>
<dd><p>A wrapper around child_process.exec that sets the cwd to the same as the host runtime</p>
</dd>
</dl>

<a name="ChildProcessAdapter"></a>

## ChildProcessAdapter
provides some utility functions for spawning processes based on top of child_process and child-process-promise.
The functions are always defaulting to use the cwd of the host runtime that is using them.

**Kind**: global class  
<a name="spawnAndCapture"></a>

## spawnAndCapture(spawnOptions, options)
asynchronously Spawn a process and capture the output as it runs.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| spawnOptions | <code>Object</code> | options to pass to the spawn function |
| options.cmd | <code>String</code> | the process to run |
| options.args | <code>Array.&lt;String&gt;</code> | an array of arguments to pass tot he process |
| options.options | <code>Object.&lt;string, any&gt;</code> | options to pass to spawn |
| options | <code>Object</code> | options for the behavior of capture |
| options.onErrorOutput | <code>function</code> | a function which will be continulally passed error output as a string as it is received, and information about the process |
| options.onOutput | <code>function</code> | a function which will be continually passed normal output as a string as it is received, and information about the process |

<a name="exec"></a>

## exec(cmd, options, ...args)
A wrapper around child_process.exec that sets the cwd to the same as the host runtime

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| cmd | <code>String</code> | the command you wish to execute |
| options | <code>Object</code> | options to pass to child_process.exec |
| ...args | <code>\*</code> | args that get passed through |