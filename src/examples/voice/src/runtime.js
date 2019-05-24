import runtime from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'
import * as moduleFactory from './module-factory'
import VoiceSynthesis from './features/voice-synthesis'
import SpeechRecognition from './features/speech-recognition'
import * as documentActions from './actions'

runtime
  .use(DocumentHelper)
  .use('editor')
  .use(moduleFactory)
  .use(documentActions)

runtime.features.register('voice-synthesis', () => VoiceSynthesis)
runtime.features.register('speech-recognition', () => SpeechRecognition)

runtime.clients.register('app', () => AppClient)

runtime.appClient = runtime.client('app')

runtime.mdxDocs.add(require.context('.', true, /\.md$/))

runtime.setState({ docsLoaded: true })

global.runtime = runtime

if (typeof speechSynthesis !== 'undefined') {
  runtime.speechSynthesis = speechSynthesis
  runtime.SpeechSynthesisUtterance = SpeechSynthesisUtterance
  speechSynthesis && speechSynthesis.getVoices()
}

export default runtime
