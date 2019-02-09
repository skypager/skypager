## Functions

<dl>
<dt><a href="#featureWasEnabled">featureWasEnabled(autoStart)</a></dt>
<dd></dd>
<dt><a href="#hashFile">hashFile()</a></dt>
<dd><p>Calculate the md5 hash of the file by its id</p>
</dd>
<dt><a href="#hashFiles">hashFiles(options)</a></dt>
<dd><p>Calculate the md5 of all files matching a set of include and/or exclude rules.</p>
</dd>
<dt><a href="#getPackages">getPackages()</a></dt>
<dd><p>Returns the package manager manifests map, which is a map of parsed package.json
files found in the project</p>
</dd>
<dt><a href="#getPackageManager">getPackageManager()</a></dt>
<dd><p>Returns a reference to the runtime&#39;s package manager</p>
</dd>
<dt><a href="#activationEventWasFired">activationEventWasFired()</a></dt>
<dd></dd>
<dt><a href="#whenActivated">whenActivated()</a></dt>
<dd><p>Returns a Promise which will resolve if, or when the file manager is activated</p>
</dd>
</dl>

<a name="featureWasEnabled"></a>

## featureWasEnabled(autoStart)
**Kind**: global function  

| Param | Type |
| --- | --- |
| autoStart | <code>Boolean</code> | 

<a name="hashFile"></a>

## hashFile()
Calculate the md5 hash of the file by its id

**Kind**: global function  
<a name="hashFiles"></a>

## hashFiles(options)
Calculate the md5 of all files matching a set of include and/or exclude rules.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.include | <code>Array</code> \| <code>function</code> \| <code>String</code> \| <code>Regexp</code> | a rule, or array of rules that the path must match |
| options.exclude | <code>Array</code> \| <code>function</code> \| <code>String</code> \| <code>Regexp</code> | a rule, or array of rules that the path must not match |

<a name="getPackages"></a>

## getPackages()
Returns the package manager manifests map, which is a map of parsed package.json
files found in the project

**Kind**: global function  
<a name="getPackageManager"></a>

## getPackageManager()
Returns a reference to the runtime's package manager

**Kind**: global function  
<a name="activationEventWasFired"></a>

## activationEventWasFired()
**Kind**: global function  
<a name="whenActivated"></a>

## whenActivated()
Returns a Promise which will resolve if, or when the file manager is activated

**Kind**: global function