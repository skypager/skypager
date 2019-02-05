## Classes

<dl>
<dt><a href="#VmFeature">VmFeature</a> ⇐ <code>Feature</code></dt>
<dd><p>The Feature helper encapsulates any functionality provided by a module, in a stateful object that can be configured and enabled at runtime
whenever it is needed by an application.  The @skypager/node runtime is just a collection of features that only make sense in a node process.  A web process
could mimic the node feature interface, and swap out direct file access with a rest controller.  A Feature exists to provide a common abstract interface for platform functionality.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#featureWasEnabled">featureWasEnabled()</a></dt>
<dd><p>This makes sure the runtime has a vm property that will work in that environment.  The browser needs vm-browserify to work</p>
</dd>
</dl>

<a name="VmFeature"></a>

## VmFeature ⇐ <code>Feature</code>
The Feature helper encapsulates any functionality provided by a module, in a stateful object that can be configured and enabled at runtime
whenever it is needed by an application.  The @skypager/node runtime is just a collection of features that only make sense in a node process.  A web process
could mimic the node feature interface, and swap out direct file access with a rest controller.  A Feature exists to provide a common abstract interface for platform functionality.

**Kind**: global class  
**Extends**: <code>Feature</code>  
<a name="featureWasEnabled"></a>

## featureWasEnabled()
This makes sure the runtime has a vm property that will work in that environment.  The browser needs vm-browserify to work

**Kind**: global function