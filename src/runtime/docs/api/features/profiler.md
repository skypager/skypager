## Classes

<dl>
<dt><a href="#ProfilerFeature">ProfilerFeature</a></dt>
<dd><p>provides basic profiling capabilities for named events.</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#report">report</a> : <code>Object.&lt;string, {start: number, end: number, duration: number}&gt;</code></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#end">end(eventName)</a></dt>
<dd></dd>
<dt><a href="#start">start(eventName)</a></dt>
<dd></dd>
</dl>

<a name="ProfilerFeature"></a>

## ProfilerFeature
provides basic profiling capabilities for named events.

**Kind**: global class  
<a name="report"></a>

## report : <code>Object.&lt;string, {start: number, end: number, duration: number}&gt;</code>
**Kind**: global variable  
<a name="end"></a>

## end(eventName)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | the name of the event you're finished timing |

<a name="start"></a>

## start(eventName)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | the name of the event you're starting to time |