# Skypager CLI

The Skypager CLI provides the `skypager` executable.

## Installation

Install using npm or yarn

```shell
# install with npm
$ npm install @skypager/cli --save
# or if you use yarn
$ yarn add @skypager/cli --save
```

## Provided Scripts

- **console** starts an interactive console using the [Skypager REPL Helper](../../helpers/repl)
- **start-and-test** starts a server and runs a test command
- **serve** starts a skypager server in the project
- **run-all** runs multiple package.json scripts, supports monorepos
- **socket** starts a skypager/node process with an ipc socket listener, once started can run scripts

If you have [Skypager Webpack Utilities](../webpack) installed, you will get the following commands:

- **build** runs a webpack compiler script
- **start** starts a webpack dev server
- **watch** starts a webpack compiler in watch mode

If you have [Skypager Devtools](../main) installed, you will get the following commands:

- **test** runs mocha-webpack in your project. 

## Script Runner

The `skypager` cli will run whatever script you tell it.  

It will look for scripts in the current folder's `scripts` directory and prioritize those.

```shell
$ skypager build
$ skypager console
$ skypager test
```

When running `skypager build` 

- First it will look in the current working directory for a file called `scripts/build.js`
- If it doesn't find it, it will check `@skypager/webpack/scripts/build.js` -- assuming you have `@skypager/webpack` installed
- If it doesn't find it, it will check `@skypager/devtools/scripts/build.js` -- assuming you have `@skypager/devtools` installed

## ESM / Babel Register Support

If you want / need your script to support babel syntax or es6 modules, you can pass the `--babel` or `--esm` flag to your command.

We will run the script with `--require=esm` or `--require=@babel/register` depending on which one you pass.

## Debugging Support

To enable the debugger, pass the `--debug` or `--inspect` flags to `skypager`

```shell
$ skypager build --inspect
```