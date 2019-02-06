## Classes

<dl>
<dt><a href="#ProfilerFeature">ProfilerFeature</a></dt>
<dd><p>provides basic profiling capabilities for named events.</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#report">report</a> : <code><a href="#TimingsReport">TimingsReport</a></code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#TimingReport">TimingReport</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#TimingsReport">TimingsReport</a> : <code>Object.&lt;String, TimingReport&gt;</code></dt>
<dd></dd>
</dl>

<a name="ProfilerFeature"></a>

## ProfilerFeature
provides basic profiling capabilities for named events.

**Kind**: global class  

* [ProfilerFeature](#ProfilerFeature)
    * [.end(eventName)](#ProfilerFeature.end)
    * [.start(eventName)](#ProfilerFeature.start)

<a name="ProfilerFeature.end"></a>

### ProfilerFeature.end(eventName)
**Kind**: static method of [<code>ProfilerFeature</code>](#ProfilerFeature)  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | the name of the event you're finished timing |

<a name="ProfilerFeature.start"></a>

### ProfilerFeature.start(eventName)
**Kind**: static method of [<code>ProfilerFeature</code>](#ProfilerFeature)  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | the name of the event you're starting to time |

<a name="report"></a>

## report : [<code>TimingsReport</code>](#TimingsReport)
**Kind**: global variable  
<a name="TimingReport"></a>

## TimingReport : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| start | <code>Number</code> | 
| stop | <code>Number</code> | 
| duration | <code>Number</code> | 

<a name="TimingsReport"></a>

## TimingsReport : <code>Object.&lt;String, TimingReport&gt;</code>
**Kind**: global typedef