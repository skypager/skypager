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
      return this.recognition.stop()
    } catch (error) {
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

    const transcriptId =
      typeof options.transcriptId === 'function'
        ? options.transcriptId(event, this)
        : options.transcriptId

    recognition.onspeechend = () => {
      this.state.set('listening', false)
    }

    recognition.onstart = () => {
      this.state.set('listening', true)
      this.emit('listening')
    }

    recognition.onend = () => {
      this.emit('stopped')
    }

    recognition.onerror = () => {
      this.state.set('errorCount', this.state.get('errorCount') + 1)
    }

    recognition.onresult = event => {
      this.emit('result', event)
      this.state.set('resultCount', this.state.get('resultCount') + 1)

      let interimTranscript = ''

      if (this.state.get('logLevel') === 'debug') {
        this.runtime.debug('speech event', event)
      }

      for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
        let transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
          onComplete && onComplete(finalTranscript)

          if (transcriptId) {
            this.transcripts.set(transcriptId, finalTranscript)
          }

          if (options.clear) {
            finalTranscript = ''
          }
        } else {
          interimTranscript += transcript
          onEvent &&
            onEvent(event, {
              speech: this,
              interimTranscript,
              transcript: interimTranscript,
              partial: transcript,
            })

          if (transcriptId) {
            this.transcripts.set(transcriptId, interimTranscript)
          }
        }
      }
    }

    if (continuous) {
      recognition.continuous = true
    }

    recognition.maxAlternatives = maxAlternatives
    recognition.interimResults = interimResults

    recognition.start()

    return () => {
      const res = recognition.stop()
      this.state.set('listening', false)
      return res
    }
  }
}
