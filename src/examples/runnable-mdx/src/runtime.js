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

skypager.mdxDocs.add(require.context('../docs', true, /\.md$/))

skypager.setState({ docsLoaded: true })

global.runtime = skypager

export default skypager
