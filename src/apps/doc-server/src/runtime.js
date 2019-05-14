import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'
import * as moduleFactory from './module-factory'

skypager
  .use(DocumentHelper)
  .use('editor')
  .use(moduleFactory)

skypager.clients.register('app', () => AppClient)

skypager.appClient = skypager.client('app')

skypager.assetLoader.script(`/mdx.bundle.js`).then(() => {
  console.log('loaded mdx bundle')
  skypager.mdxDocs.add(global.SkypagerDocServerMdxDocs.default)
}).then(() => {
  skypager.setState({
    docsLoaded: true
  })
})

global.runtime = skypager

export default skypager
