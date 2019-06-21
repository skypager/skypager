import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as moduleFactory from './module-factory'
import docs from './features/docs'
import { createBrowserHistory } from 'history'

skypager.history = createBrowserHistory()

skypager.history.listen((location, action) => {
  const { hash: locationHash, pathname: locationPathname } = location
  skypager.setState({ location, locationPathname, locationHash })
})

skypager
  .use(DocumentHelper)
  .use('editor')
  .use(moduleFactory)
  .use(docs)
  .use(next => setupDocs().then(() => next()))
  .start()

global.runtime = skypager

export default skypager

async function setupDocs() {
  skypager.docs.acceptContext(require.context('../docs', true, /\.md$/))
  skypager.setState({ docsLoaded: true })
}
