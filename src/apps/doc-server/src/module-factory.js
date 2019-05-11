
/** 
 * This makes certain modules available for requiring / importing
 * from the code blocks 
*/
export function attach(runtime) {
  runtime.feature('bundle').enable()

  runtime.bundle.loadWebpack({
    requireFn: __webpack_require__,
    cache: require.cache,
    resolveFn: request => require.resolveWeak(request),
  })

  const moduleFactory = {
    createRequireFunction: filename => {
      return (request) => runtime.bundle.require(request)
    },
  }  

  runtime.getter('moduleFactory', () => moduleFactory)

  require('semantic-ui-react')

  runtime.bundle.register({
    react: require.resolveWeak('react'),
    skypager: require.resolveWeak('@skypager/web'),
    '@skypager/web': require.resolveWeak('@skypager/web'),
    '@skypager/runtime': require.resolveWeak('@skypager/web'),
    'react-dom': require.resolveWeak('react-dom'),
    'react-router-dom': require.resolveWeak('react-router-dom'),
    'semantic-ui-react': window.semanticUIReact,
    lodash: runtime.lodash,
    mobx: runtime.mobx,
    ...Object.keys(runtime.lodash)
      .filter(v => v !== 'VERSION')
      .reduce(
        (memo, fn) => ({
          ...memo,
          [`lodash/${fn}`]: runtime.lodash[fn],
        }),
        {}
      ),
  })
}
