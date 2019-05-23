import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'
import * as moduleFactory from './module-factory'
import VoiceSynthesis from './features/synth'
import SpeechRecognition from './features/speech'

skypager
  .use(DocumentHelper)
  .use('editor')
  .use(moduleFactory)

skypager.features.register('voice-synthesis', () => VoiceSynthesis)
skypager.features.register('speech-recognition', () => SpeechRecognition)

skypager.clients.register('app', () => AppClient)

skypager.appClient = skypager.client('app')

skypager.mdxDocs.add(require.context('./docs', true, /\.md$/))

skypager.setState({ docsLoaded: true })

global.runtime = skypager

global.doc = skypager.mdxDoc('voice-synthesis', {
  cacheHelper: true,
})

if (typeof speechSynthesis !== 'undefined') {
  skypager.speechSynthesis = speechSynthesis
  skypager.SpeechSynthesisUtterance = SpeechSynthesisUtterance
  speechSynthesis && speechSynthesis.getVoices()
}

export default skypager
