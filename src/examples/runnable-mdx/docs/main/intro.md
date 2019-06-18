# Introduction

The Skypager Document Helper makes it possible to build interfaces for reading, writing, and running your code and documentation in creative ways.

As developers, we're comfortable reading and writing JavaScript and Markdown in their source code form in our IDEs or editors.  

We're comfortable with using compiler tools to turn them from their source code form, into something usable in a web browser.

So much additional information about each of the files we edit is available to us, because of this.  

The Skypager Document helper helps you take advantage of this additional information to present your code and writing in creative ways, and make it more accessible to others.

It even lets you expose APIs that enable other people to contribute or modify your code in whatever ways you define.

## How does it work?

Every JavaScript or Markdown file in your project is unique and special in some way.  

They're special in and of themselves because they all go through a compile phase, where they're turned into an AST, before they're ultimately rendered in some other form.  

It is at this point, that your system can know the most about these files.  What do they depend on? what do they reference? what exactly do they contribute to the project? how are they used?

They're unique because of their names.  Ever file has its own unique path.  

Their names make them special - React components which live in a `pages/` folder, and React components which live in a `layouts/` folder, it is safe to assume, have their own patterns and purposes in the scheme of the project. 

Similarly a folder of markdown files called `daily-standups` might all have common headings. 

```markdown
# Jon's Daily Standup
> December 18th, 2018

Today's gonna be a good day.

## Yesterday

- [x] Killed it

## Today

- [ ] Bringing it back

```

This pattern makes these documents special, in that we could write a script to aggregate a bunch of them provided they all follow the same heading format, turn it into actual data. 

Using this data I can present the same writing in more useful ways compared to using markdown as we traditionally do, purely to generate the exact HTML that is written.

The Skypager Document helper makes it easy to use all of the information about your files, and their relationships to one another, and their overall purpose scheme in the project.

The skypager runtime is designed to work with collections of helpers. By providing all of this data and context to the Skypager Runtime, the Document Helper enables database like APIs for your files.  

## What can you do with it?

- You can use this information to generate documentation websites on steroids.  
- React examples which render themselves.  
- Shell / CLI examples which run themselves and generate terminal SVG screencasts   
- JavaScript examples which can be run and tested, reporting pass / failure state.
- You can use the information in the writing to automate tasks whose input and output can be gathered from analyzing the writing.  Say you wanted to generate an invoice for your team's hours based on all of the daily standups.
- You can generate markdown documentation for all of your JavaScript source code, and then query that markdown documentation to find classes which aren't sufficiently documented, and then open them all in your editor.
- You can generate typescript definitions from your JavaScript source code.
