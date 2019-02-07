# Browser VM

This feature makes it easy to take a chunk of javascript code as a string,
and run it as if it were inside of a browser using JSDOM.  You will get back the 
code, the result of the code, and the global context variable in a state after the script ran. 

```javascript
import runtime from '@skypager/node'
import '@skypager/features-browser-vm'

const browserVm = runtime.feature('browser-vm')

async function main() {
  const webpackBundledApp = await runtime.fsx.readFileAsync(runtime.resolve('build', 'app.js'))
  const { result, context } = await browserVm.runScript(webpackBundledApp)
  const { App } = context

  console.log('App Component', App)
}

main()
```