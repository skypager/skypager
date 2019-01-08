#!/bin/sh

ROOT=`pwd`

# do the styleguide sketch file 
mkdir -p $ROOT/test/fixtures/StyleGuide/artboards $ROOT/test/fixtures/StyleGuide/pages
cd $ROOT/test/fixtures/StyleGuide
sketchtool list artboards ../StyleGuide.sketch > artboards.json
sketchtool list layers ../StyleGuide.sketch > layers.json
sketchtool list pages ../StyleGuide.sketch > pages.json
sketchtool dump ../StyleGuide.sketch > dump.json
sketchtool metadata ../StyleGuide.sketch > metadata.json
cd $ROOT/test/fixtures/StyleGuide/pages
sketchtool export pages ../../StyleGuide.sketch
cd $ROOT/test/fixtures/StyleGuide/artboards
sketchtool export artboards ../../StyleGuide.sketch

# do the web application
mkdir -p $ROOT/test/fixtures/WebApplication/artboards $ROOT/test/fixtures/WebApplication/pages
cd $ROOT/test/fixtures/WebApplication
sketchtool list artboards ../WebApplication.sketch > artboards.json
sketchtool list layers ../WebApplication.sketch > layers.json
sketchtool list pages ../WebApplication.sketch > pages.json
sketchtool dump ../WebApplication.sketch > dump.json
sketchtool metadata ../WebApplication.sketch > metadata.json
cd $ROOT/test/fixtures/WebApplication/pages
sketchtool export pages ../../WebApplication.sketch
cd $ROOT/test/fixtures/WebApplication/artboards
sketchtool export artboards ../../WebApplication.sketch