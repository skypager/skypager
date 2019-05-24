import { Feature } from '@skypager/runtime'

export default class SpeechRecognition extends Feature {
  static shortcut = 'speech'
  static isObservable = true
  static isCacheable = true

  initialState = {
    activated: false,
    logLevel: 'silent',
    listening: false,
    resultCount: 0,
    errorCount: 0,
  }

  observables() {
    return {
      transcripts: ['shallowMap', []],
    }
  }

  enableLogging(level) {
    this.state.set('logLevel', level === true ? 'debug' : level || 'silent')
  }

  get isActivated() {
    return !!(this.runtime.isFeatureEnabled('speech-recognition') && this.state.get('activated'))
  }

  get isSupported() {
    return !!(
      (this.runtime.isBrowser && this.SpeechRecognition) ||
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    )
  }

  featureWasEnabled(settings = {}) {
    if (settings.SpeechRecognition) {
      this.SpeechRecognition = settings.SpeechRecognition
    }

    this.state.set('activated', settings.active !== false)
  }

  /**
   * This hook will get called when the program says
   *
   * runtime.feature('voice-synthesis').enable()
   *
   * You can inject your own `speechSynthesis` and `SpeechSynthesisUtterance` if they're not available in the window scope
   */
  initialize() {
    const {
      SpeechRecognition = this.runtime.SpeechRecognition ||
        window.SpeechRecognition ||
        window.webkitSpeechRecognition,
    } = this.options

    if (SpeechRecognition) {
      this.SpeechRecognition = SpeechRecognition
    }
  }

  get recognition() {
    return this._recognition || (this._recognition = new this.SpeechRecognition())
  }

  stop() {
    try {
      this.recognition.abort()
    } catch(error) {
      console.log('error stopping', error)
    } 

    return this
  }

  get isListening() {
    return !!this.state.get('listening')
  }

  listen(options = {}) {
    const { recognition } = this

    const {
      onComplete = transcript => console.log({ transcript }),
      onEvent,
      continuous = true,
      maxAlternatives = 10,
      stream = true,
      interimResults = stream,
    } = options

    let finalTranscript = ''

    recognition.onstart = () => {
      this.state.set('listening', true)
      this.emit('listening')
    }

    recognition.onend = () => {
      this.state.set('listening', false)
      this.emit('stopped')
    }

    recognition.onerror = () => {
      this.state.set('errorCount', this.state.get('errorCount') + 1)
    }

    recognition.onresult = event => {
      this.emit('result', event)
      this.state.set('resultCount', this.state.get('resultCount') + 1)

      let interimTranscript = ''

      onEvent && onEvent(event, { speech: this, interimTranscript })

      if (this.state.get('logLevel') === 'debug') {
        this.runtime.debug('speech event', event)
      }

      for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
        let transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
          if (options.transcriptId) {
            this.transcripts.set(options.transcriptId, interimTranscript)
          }
        }
      }

      if (options.transcriptId) {
        onComplete && onComplete(finalTranscript)
        this.transcripts.set(options.transcriptId, finalTranscript)
      }
    }

    if (continuous) {
      recognition.continuous = true
    }

    recognition.maxAlternatives = maxAlternatives
    recognition.interimResults = interimResults

    recognition.start()

    return () => {
      this.state.set('listening', false)
      return recognition.abort()
    }
  }
}
