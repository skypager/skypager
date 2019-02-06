<a name="FileDownloaderFeature"></a>

## FileDownloaderFeature
The File Downloader can download files from http(s) urls into the local path

**Kind**: global class  

* [FileDownloaderFeature](#FileDownloaderFeature)
    * [.downloadAsync(sourceUrl, destinationPath)](#FileDownloaderFeature.downloadAsync) ⇒ <code>PromiseLike.&lt;String&gt;</code>
    * [.download(sourceUrl, destinationPath, [callback])](#FileDownloaderFeature.download)

<a name="FileDownloaderFeature.downloadAsync"></a>

### FileDownloaderFeature.downloadAsync(sourceUrl, destinationPath) ⇒ <code>PromiseLike.&lt;String&gt;</code>
Download a URL to a destination path

**Kind**: static method of [<code>FileDownloaderFeature</code>](#FileDownloaderFeature)  
**Returns**: <code>PromiseLike.&lt;String&gt;</code> - absolute path to the saved file  

| Param | Type |
| --- | --- |
| sourceUrl | <code>String</code> | 
| destinationPath | <code>String</code> | 

<a name="FileDownloaderFeature.download"></a>

### FileDownloaderFeature.download(sourceUrl, destinationPath, [callback])
Download a URL to a a destination

**Kind**: static method of [<code>FileDownloaderFeature</code>](#FileDownloaderFeature)  

| Param | Type | Description |
| --- | --- | --- |
| sourceUrl | <code>String</code> |  |
| destinationPath | <code>String</code> |  |
| [callback] | <code>function</code> | if you leave off the function, we'll give you the promise api of downloadSync |