import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'

skypager.use(DocumentHelper)

skypager.mdxDocs.add(require.context('../docs', true, /\.md$/))

skypager.features.add(require.context('./features', false, /\.js$/))

skypager.clients.register('app', () => AppClient)

skypager.appClient = skypager.client('app')

export default skypager
