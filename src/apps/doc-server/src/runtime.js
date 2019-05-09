import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'

skypager.use(DocumentHelper).use('editor')

skypager.mdxDocs.add(require.context('../docs', true, /\.md$/))

skypager.clients.register('app', () => AppClient)

skypager.appClient = skypager.client('app')

global.runtime = skypager

export default skypager
