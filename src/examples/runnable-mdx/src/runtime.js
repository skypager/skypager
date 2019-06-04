import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'
import * as moduleFactory from './module-factory'
import { createBrowserHistory } from 'history'

skypager.history = createBrowserHistory()

skypager.history.listen((location, action) => {
  skypager.setState({ location })
})

skypager
  .use(DocumentHelper)
  .use('editor')
  .use(moduleFactory)
  .use(next => setupDocs().then(() => next()))
  .start()

skypager.clients.register('app', () => AppClient)

skypager.appClient = skypager.client('app')

skypager.mdxDocs.add(require.context('../docs', true, /\.md$/))

global.runtime = skypager

export default skypager

async function setupDocs() {
  const { docsLoaded } = skypager.currentState

  if (!docsLoaded) {
    await Promise.all([
      skypager.editor.loadBraceMode('markdown'),
      skypager.editor.loadBraceMode('html'),
    ])

    skypager.setState({ docsLoaded: true })
  }
}
