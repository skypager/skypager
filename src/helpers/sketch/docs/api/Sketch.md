## Classes

<dl>
<dt><a href="#Sketch">Sketch</a></dt>
<dd><p>The Sketch Helper provides a class which can represent a single sketch file on your system.
It depends on the sketchtool binary that comes with the sketchapp itself, and under the hood
just shells out to this command to get the data it needs.
Once you have loaded a sketch helper instance and built it, you will have all of the data available to you
that can be extracted from the sketchtool CLI, including information about the pages, artboards, and layers,
as well as the full JSON dump of the sketch internal object tree, which you can traverse.
You can use the sketch helper to generate CSS, extract assets, or whatever else you might need when trying to
integrate a designer&#39;s tools into your project or portfolio.
To use the Sketch helper in the browser, you will need to provide this data directly in your module.
We provide a webpack loader that will do this @skypager/helpers-sketch/sketchtool-loader.js
or you can use functions provided by @skypager/helpers-sketch/cli.js *</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#MobxObservableMap">MobxObservableMap</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SketchState">SketchState</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ArtboardSnapshot">ArtboardSnapshot</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#LayerSnapshot">LayerSnapshot</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ArtboardSummary">ArtboardSummary</a> : <code>Object.&lt;String, Object&gt;</code></dt>
<dd></dd>
<dt><a href="#SketchMeta">SketchMeta</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ArtboardMeta">ArtboardMeta</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ArtboardList">ArtboardList</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Bounds">Bounds</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#LayerMeta">LayerMeta</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#LayersList">LayersList</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#PageMeta">PageMeta</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#PagesList">PagesList</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Sketch"></a>

## Sketch
The Sketch Helper provides a class which can represent a single sketch file on your system.
It depends on the sketchtool binary that comes with the sketchapp itself, and under the hood
just shells out to this command to get the data it needs.
Once you have loaded a sketch helper instance and built it, you will have all of the data available to you
that can be extracted from the sketchtool CLI, including information about the pages, artboards, and layers,
as well as the full JSON dump of the sketch internal object tree, which you can traverse.
You can use the sketch helper to generate CSS, extract assets, or whatever else you might need when trying to
integrate a designer's tools into your project or portfolio.
To use the Sketch helper in the browser, you will need to provide this data directly in your module.
We provide a webpack loader that will do this @skypager/helpers-sketch/sketchtool-loader.js
or you can use functions provided by @skypager/helpers-sketch/cli.js *

**Kind**: global class  

* [Sketch](#Sketch)
    * [.state](#Sketch+state) : [<code>MobxObservableMap</code>](#MobxObservableMap)
    * [.isBuilt](#Sketch+isBuilt) : <code>Boolean</code>
    * [.currentState](#Sketch+currentState) : [<code>SketchState</code>](#SketchState)
    * [.pages](#Sketch+pages) : [<code>Array.&lt;PageMeta&gt;</code>](#PageMeta)
    * [.artboards](#Sketch+artboards) : [<code>Array.&lt;ArtboardSnapshot&gt;</code>](#ArtboardSnapshot)
    * [.layers](#Sketch+layers) : [<code>Array.&lt;LayerSnapshot&gt;</code>](#LayerSnapshot)
    * [.layerStyles](#Sketch+layerStyles)
    * [.pageNames](#Sketch+pageNames) : <code>Array.&lt;String&gt;</code>
    * [.artboardCategories](#Sketch+artboardCategories) : <code>Array.&lt;String&gt;</code>
    * [.path](#Sketch+path)
    * [.build()](#Sketch+build) ⇒ [<code>Promise.&lt;SketchState&gt;</code>](#SketchState)
    * [.listAllArtboards(options)](#Sketch+listAllArtboards) ⇒ [<code>Promise.&lt;ArtboardSnapshot&gt;</code>](#ArtboardSnapshot)
    * [.listAllLayers(options)](#Sketch+listAllLayers) ⇒ [<code>Promise.&lt;LayerSnapshot&gt;</code>](#LayerSnapshot)
    * [.loadMetadata([pathToSketchFile], [options])](#Sketch+loadMetadata) ⇒ [<code>Promise.&lt;SketchMeta&gt;</code>](#SketchMeta)
    * [.loadArtboards([pathToSketchFile], [options])](#Sketch+loadArtboards) ⇒ [<code>Promise.&lt;ArtboardList&gt;</code>](#ArtboardList)
    * [.loadLayers([pathToSketchFile], [options])](#Sketch+loadLayers) ⇒ [<code>Promise.&lt;LayersList&gt;</code>](#LayersList)
    * [.loadPages([pathToSketchFile], [options])](#Sketch+loadPages) ⇒ [<code>Promise.&lt;PagesList&gt;</code>](#PagesList)
    * [.loadDump([pathToSketchFile], [options])](#Sketch+loadDump)

<a name="Sketch+state"></a>

### sketch.state : [<code>MobxObservableMap</code>](#MobxObservableMap)
**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+isBuilt"></a>

### sketch.isBuilt : <code>Boolean</code>
Returns true after the build method is called.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+currentState"></a>

### sketch.currentState : [<code>SketchState</code>](#SketchState)
Returns a JSON snapshot of the sketch document's state.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+pages"></a>

### sketch.pages : [<code>Array.&lt;PageMeta&gt;</code>](#PageMeta)
Returns information about the sketch documents pages, * will only work after build method is called.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+artboards"></a>

### sketch.artboards : [<code>Array.&lt;ArtboardSnapshot&gt;</code>](#ArtboardSnapshot)
Returns information about the sketch document's artboards.  Will only work after build method is called.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+layers"></a>

### sketch.layers : [<code>Array.&lt;LayerSnapshot&gt;</code>](#LayerSnapshot)
Returns information about the sketch document's artboards.  Will only work after build method is called.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+layerStyles"></a>

### sketch.layerStyles
Returns raw data from the sketchtool dump about this document's shared layer styles.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+pageNames"></a>

### sketch.pageNames : <code>Array.&lt;String&gt;</code>
Returns an array of the page names defined in this sketch document.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+artboardCategories"></a>

### sketch.artboardCategories : <code>Array.&lt;String&gt;</code>
Assuming the artboard names follow some convention where the name includes
a category of some sort, this will give you the values found.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+path"></a>

### sketch.path
Returns the absolute path to the sketchfile being represented by this instance.

**Kind**: instance property of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+build"></a>

### sketch.build() ⇒ [<code>Promise.&lt;SketchState&gt;</code>](#SketchState)
Fetches all of the information from the sketchtool that we can, and puts this data
in the sketch helper's state.  Loading all of the data from sketchtool into memory,
and saving it in this state structure, allows us to build different data abstractions
from that raw data, without having to run sketchtool more often than we need to.

**Kind**: instance method of [<code>Sketch</code>](#Sketch)  
<a name="Sketch+listAllArtboards"></a>

### sketch.listAllArtboards(options) ⇒ [<code>Promise.&lt;ArtboardSnapshot&gt;</code>](#ArtboardSnapshot)
Returns a normalized array of objects representing each of the artboards in the sketch file.

**Kind**: instance method of [<code>Sketch</code>](#Sketch)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  |  |
| [options.namePatter