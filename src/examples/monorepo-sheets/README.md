# Monorepo Sheets Sync

This is an example of a script which uses the following skypager components:

- [Package Manager](../../features/package-manager) - manage all of the package.json files and folders in your portfolio 
- [Google Sheet Helper](../../helpers/google-sheet) - turn any google sheet into javascript objects, change the object, change the sheet.

It creates a [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1iztOlibprVg4JOrEAen4_69iEwoW-ScIeuSEUTL3t2U/edit?usp=sharing) where each
row is a project in your portfolio or monorepo.  We keep track of name, version, description, license, keywords, and a project type and category attribute as well. 

You can sync the spreadsheet with your code or vice versa with this script.

## Usage 

Running the following will read all of the package.json manifests in your project, and publish them to google sheets.

```shell
$ node scripts/sync.js 
```

Running the following will read the google sheet, and apply any changes it needs to the package.json manifests so that they are in sync.

```shell
$ node scripts/sync.js inbound
```

## Highlights

The `sheet` represents the google sheet itself

The sheet name `projects` contains rows of attributes, whose names match the column headers. 

The `Project` class will have getters and setters for each column header.  We're taking keywords from a package.json, which are an array of strings,
and saving them in the sheet as strings on their own line.  We're reading them from the sheet the same way, and then converting them back to an array of strings.  

```javascript
const sheet = runtime.sheet('skypagermonorepo')

function registerEntityClasses(sheet) {
  class Project extends sheet.RowEntity {
    set keywords(list) {
      const keywordsCell = this.attributesToCellsMap['keywords']     

      if (keywordsCell) {
        keywordsCell.value = list.join("\n")
      }
    }

    get keywords() {
      const keywordsCell = this.attributesToCellsMap['keywords']     
      if (keywordsCell) {
        return String(keywordsCell.value).split("\n").map(k => String(k).trim())
      } else {
        return []
      }
    }
  }

  try {
    return sheet.registerEntity(sheetName, () => Project)
  } catch (error) {
    console.log(sheet.worksheetIds, sheet.worksheetTitles)
  }
}
```

The [Package Manager](../../features/package-manager) feature provides a similar entity class called `Package`,
which has similar behavior.  Getters and setters for package.json fields.  When you set a value, it saves the json to disk.

```javascript
const sheetRow = sheet.findByName('@skypager/web')
const project = packageManager.findByName('@skypager/web')

sheetRow.description = project.description  
project.keywords = sheetRow.keywords

await sheetRow.save()
await project.save()
```