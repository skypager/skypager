## Classes

<dl>
<dt><a href="#GoogleSheet">GoogleSheet</a></dt>
<dd><p>The GoogleSheet Helper represents an individual google spreadsheet document as a stateful JavaScript module.</p>
<p>You can access all of the individual worksheets in the spreadsheet, as well as all columns and rows in the worksheet.  You can set values or formulas, create new worksheets, etc.</p>
<p>Each individual instance of the spreadsheet has a registry of RowEntity classes specific to each worksheet.  These RowEntity objects have getters and setters for all of the column names.</p>
<p>You can subclass RowEntity with a specific class for that worksheet, and assign that subclass to the worksheet.  This allows you to build ORM like applications on top not only that google spreadsheet,
but relationally across all of the google spreadsheets you have in the GoogleSheet helper registry.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SpreadsheetInfo">SpreadsheetInfo</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SpreadsheetWorksheet">SpreadsheetWorksheet</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Runtime">Runtime</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#GoogleFeature">GoogleFeature</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="GoogleSheet"></a>

## GoogleSheet
The GoogleSheet Helper represents an individual google spreadsheet document as a stateful JavaScript module.

You can access all of the individual worksheets in the spreadsheet, as well as all columns and rows in the worksheet.  You can set values or formulas, create new worksheets, etc.

Each individual instance of the spreadsheet has a registry of RowEntity classes specific to each worksheet.  These RowEntity objects have getters and setters for all of the column names.

You can subclass RowEntity with a specific class for that worksheet, and assign that subclass to the worksheet.  This allows you to build ORM like applications on top not only that google spreadsheet,
but relationally across all of the google spreadsheets you have in the GoogleSheet helper registry.

**Kind**: global class  

* [GoogleSheet](#GoogleSheet)
    * [.sheetId](#GoogleSheet+sheetId) : <code>String</code>
    * [.RowEntity](#GoogleSheet+RowEntity) : <code>function</code>
    * [.data](#GoogleSheet+data) : <code>Object.&lt;String, Array.&lt;Object&gt;&gt;</code>
    * [.info](#GoogleSheet+info) : [<code>SpreadsheetInfo</code>](#SpreadsheetInfo)
    * [.worksheets](#GoogleSheet+worksheets) : [<code>Array.&lt;SpreadsheetWorksheet&gt;</code>](#SpreadsheetWorksheet)
    * [.spreadsheet](#GoogleSheet+spreadsheet) : <code>GoogleSpreadsheet</code>
    * [.worksheetsIndex](#GoogleSheet+worksheetsIndex) : <code>Map</code>
    * [.runtime](#GoogleSheet+runtime) : [<code>Runtime</code>](#Runtime)
    * [.entityHandlers](#GoogleSheet+entityHandlers)
    * [.autoSaveEnabled](#GoogleSheet+autoSaveEnabled) : <code>Boolean</code>
    * [.sheetInterface](#GoogleSheet+sheetInterface) : <code>Object.&lt;String, function()&gt;</code>
    * [.google](#GoogleSheet+google)
    * [.authorized](#GoogleSheet+authorized) : <code>Boolean</code>
    * [.isReady](#GoogleSheet+isReady) : <code>Boolean</code>
    * [.tryResult(attribute, defaultValueOrFunction)](#GoogleSheet+tryResult)
    * [.tryGet(attribute, defaultValue)](#GoogleSheet+tryGet)
    * [.registerEntity(sheetName, fn)](#GoogleSheet+registerEntity)
    * [.getEntityClass(sheetName)](#GoogleSheet+getEntityClass) ⇒ <code>function</code>
    * [.enableAutoSave()](#GoogleSheet+enableAutoSave)
    * [.disableAutoSave()](#GoogleSheet+disableAutoSave)
    * [.allEntities()](#GoogleSheet+allEntities) ⇒ <code>Promise.&lt;Object.&lt;String, Array.&lt;RowEntity&gt;&gt;&gt;</code>
    * [.ws(worksheetTitle)](#GoogleSheet+ws) ⇒ <code>Promise.&lt;Worksheet&gt;</code>
    * [.sheet()](#GoogleSheet+sheet) ⇒ <code>Worksheet</code>
    * [.applySheetInterface()](#GoogleSheet+applySheetInterface)
    * [.loadAll(options)](#GoogleSheet+loadAll) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.createSpreadsheet(options)](#GoogleSheet+createSpreadsheet) ⇒ <code>GoogleSpreadsheet</code>
    * [.getInfo()](#GoogleSheet+getInfo) ⇒ [<code>Promise.&lt;SpreadsheetInfo&gt;</code>](#SpreadsheetInfo)
    * [.getRows(worksheet, options)](#GoogleSheet+getRows) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.getCells(worksheet, options)](#GoogleSheet+getCells) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.bulkUpdateCells(worksheet, cells)](#GoogleSheet+bulkUpdateCells)
    * [.findSheetId(alias, [errorOnMissing])](#GoogleSheet+findSheetId) ⇒ <code>String</code>
    * [.addRow(worksheetId, rowData)](#GoogleSheet+addRow)
    * [.addWorksheet(options)](#GoogleSheet+addWorksheet)
    * [.removeWorksheet(sheetOrSheetIdOrIndex)](#GoogleSheet+removeWorksheet)
    * [.whenReady()](#GoogleSheet+whenReady) ⇒ <code>Promise</code>
    * [.authorize(serviceAccountPathOrJSON)](#GoogleSheet+authorize) ⇒ <code>Promise.&lt;Boolean&gt;</code>

<a name="GoogleSheet+sheetId"></a>

### googleSheet.sheetId : <code>String</code>
The sheetId is the unique id component of the google spreadsheet URL.

**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+RowEntity"></a>

### googleSheet.RowEntity : <code>function</code>
The RowEntity class is a dynamically generated class which contains getters and setters for all of the column names.  The setters can be 
set up to autosave the value to the underlying row / cell in the worksheet represented by that RowEntity and the attribute you're setting.

**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+data"></a>

### googleSheet.data : <code>Object.&lt;String, Array.&lt;Object&gt;&gt;</code>
The sheet data is an object, keyed by worksheet title.  The values are arrays of objects representing all of the data in the sheet.  The keys of the row level objects,
will match the column heading values entered on row 1.

**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+info"></a>

### googleSheet.info : [<code>SpreadsheetInfo</code>](#SpreadsheetInfo)
**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+worksheets"></a>

### googleSheet.worksheets : [<code>Array.&lt;SpreadsheetWorksheet&gt;</code>](#SpreadsheetWorksheet)
**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+spreadsheet"></a>

### googleSheet.spreadsheet : <code>GoogleSpreadsheet</code>
**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+worksheetsIndex"></a>

### googleSheet.worksheetsIndex : <code>Map</code>
**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+runtime"></a>

### googleSheet.runtime : [<code>Runtime</code>](#Runtime)
**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+entityHandlers"></a>

### googleSheet.entityHandlers
entityHandlers is a Map whose keys are the titles of this spreadsheet's worksheets,
and whose values are RowEntity subclasses (or models) to use to represent each row as an ActiveRecord like object.

**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+autoSaveEnabled"></a>

### googleSheet.autoSaveEnabled : <code>Boolean</code>
Returns true if the autoSave behavior is enabled for RowEntity setters

**Kind**: instance property of [<code>GoogleSheet</code>](#GoogleSheet)  
<a name="GoogleSheet+sheetInterface"></a>

### googleSheet.sheetInterface : <code>Object.&lt;String, function()&gt;</code>
The sheetInterface can be a part of a JavaScript module that you register with the GoogleSheet helper registry,
or it can be passed in as an object when you create an instance of the sheet helper with the runtime.sheet factory function.

Any function you export from that module, or pass in as options at create time, will be a part of the interface.

Interface module function names that start with the word get will be treated as getters.

Interface module function names that start with the word lazy wil