# Content Manager 

This feature provides a way for managing content in a project using the i18n-next framework, and something like Google Sheets, Google Docs,
or Wordpress JSON API as a backend for storing content.  

It includes a CLI script for automating the migration of an existing project to a content managed version of the same project.

## Content Managed React Components 

The Value of a CMS is in providing a low-code UI for managing the content on a website.

Developing React apps doesn't preclude you from using a CMS.  In fact, React's context API is the perfect solution
for delivering your UI labels / Copy / Content as data, and rendering it as data instead of hand-written string literals in your JSX.

Coding your React Components this way makes them CMS Ready.

The migration script will extract all of your string literals from your JSX code, and upload them to a google spreadsheet.

It will reduce them to a unique set of phrases in another worksheet.  

When you edit the unique phrase, it changes all instances of that phrase in the code to your replacement.

You can replace the string literals, with calls to the i18n string provider function.

## i18n Next

TODO

## CLI

### i18n

Dump content from various data sources into i18n language definition files for the i18n next framework.

```shell
$ skypager cms i18n
```

### Sheets Sync

```shell
$ skypager cms sheets-sync
```

Uses the [@skypager/helpers-document](https://doc-helper.skypager.io) library to convert all of your source code into a searchable AST,
from there identifies all of the string literal values that might be UI content, labels, or copy -- things that you might be able to manage in a CMS.

Puts these into a spreadsheet database, each instance tagged with the file, the line / column, and the string literal value.  

Editing the sheet can be syncd with the same source code, to have bi-directional syncing, turning the spreadsheet into an extension of the IDE.

#### Setup 

This will create a google spreadsheet for your project, with the worksheets you need to sync your project's string literal source code 
content with a google spreadsheet.

```shell
$ skypager cms sheets-sync setup
```

#### Publish

This will populate the google sheet with all of the string literal values.  Running it more than once will only update what has changed.  Ideally
this will run on a clean source tree.

```shell
$ skypager cms sheets-sync publish
```

#### Apply Edits

This will take the edits from the sheet, and apply them back to the source code.  If the source code has changed since the last time it was published,
the edits will be ignored.

```shell
$ skypager cms sheets-sync apply-edits 
```

