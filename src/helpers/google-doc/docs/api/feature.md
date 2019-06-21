<a name="listFiles"></a>

## listFiles(options)
Returns a list of file objects from the google drive files API.  Is a convenience wrapper for constructing
the query syntax more easily. See https://developers.google.com/drive/api/v3/search-files for the exact parameters.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  |  |
| [options.maxResults] | <code>Number</code> | <code>100</code> | the maximum number of results to show |
| [options.sharedWithMe] | <code>Boolean</code> | <code>true</code> | return files that are shared with you, in addition to ones you own |
| [options.teamDrives] | <code>Boolean</code> | <code>true</code> | return files that are shared with you in team drives, in addition to ones you own |
| [options.handleResponse] | <code>Boolean</code> | <code>false</code> | useful for debugging purposes to see the full axios response object from google's rest API |
| [options.teamDriveOptions] | <code>Object</code> |  | specify your own team drive options |
| [options.trashed] | <code>Boolean</code> | <code>false</code> | include trashed files in the results |
| [options.parentsOperator] | <code>String</code> | <code>&#x27;and&#x27;</code> | which operator to use when using the parents parameter |
| [options.parents] | <code>Array</code> | <code>[]</code> | parent folder ids to search |
| [options.mimeType] | <code>String</code> |  | limit the search by mimeType, useful for finding google docs, vs sheets, folders, etc |
| [options.and] | <code>String</code> |  | an additional query condition that must return match |
| [options.or] | <code>String</code> |  | an additional query condition that can also return match |