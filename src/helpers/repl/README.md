# Skypager REPL Helper

Provides an enhanced REPL which loads the skypager runtime in the context of your current project.

This helper is automatically loaded for the [Skypager Node Runtime](../../runtimes/node)

## CLI Usage

To use the REPL Helper, you can just run the console command with [Skypager CLI](../../devtools/cli)

```shell
$ skypager console
```

## Node Usage

```javascript
const runtime = require('@skypager/node')
const repl = runtime.repl('interactive')

async function main() {
  await repl.launch({
    runtime,
    whatever: 'you pass to launch will be defined in the repl'
  })
}

main()
```