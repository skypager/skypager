import { Feature } from '@skypager/runtime'

export default class SpeechSynthesis extends Feature {
  static shortcut = 'synth'
  static isObservable = true
  static isCacheable = true

  initialState = {
    voicesAvailable: false,
    activated: false,
  }

  featureWasEnabled(settings = {}) {
    if (settings.speechSynthesis) {
      this.speechSynthesis = settings.speechSynthesis
    }

    if (settings.SpeechSynthesisUtterance) {
      this.SpeechSynthesisUtterance = settings.SpeechSynthesisUtterance
    }

    this.state.set('activated', settings.active !== false)

    this.speechSynthesis.onvoiceschanged = () => {
      try {
        this.loadVoices()
      } catch (error) {}
    }
  }

  get isActivated() {
    return !!(this.runtime.featureIsEnabled('voice-synthesis') && this.state.get('activated'))
  }

  /**
   * The feature is only supported if the apis are available or have been injected
   */
  get isSupported() {
    const { isFunction } = this.lodash

    const {
      // make these dependencies injectable
      speechSynthesis = this.runtime.get('speechSynthesis', window.speechSynthesis),
      SpeechSynthesisUtterance = this.runtime.get(
        'SpeechSynthesisUtterance',
        window.SpeechSynthesisUtterance
      ),
    } = this.options

    if (!speechSynthesis || !SpeechSynthesisUtterance) {
      // not available
      return false
    }

    if (!isFunction(speechSynthesis.speak) || !isFunction(speechSynthesis.getVoices)) {
      // apis arent as we expect
      return false
    }

    return true
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
      speechSynthesis = this.runtime.speechSynthesis || window.speechSynthesis,
      SpeechSynthesisUtterance = this.runtime.SpeechSynthesisUtterance ||
        window.SpeechSynthesisUtterance,
    } = this.options

    if (speechSynthesis) {
      this.speechSynthesis = speechSynthesis
    }

    if (SpeechSynthesisUtterance) {
      this.SpeechSynthesisUtterance = SpeechSynthesisUtterance
    }
  }

  get voices() {
    const { keyBy } = this.lodash
    const { voices = [] } = this.currentState

    if (voices.length) {
      return keyBy(voices, v => v.name.toLowerCase())
    }

    const fetched = this.loadVoices()
    return keyBy(fetched, v => v.name.toLowerCase())
  }

  loadVoices() {
    if (!this.speechSynthesis) {
      console.log('no synth available')
      return []
    }

    const fetched = Array.from(this.speechSynthesis.getVoices())
    console.log('fetched', fetched)

    if (fetched[0]) {
      this.state.set('voices', fetched)
      this.state.set('voicesAvailable', true)
    }

    return fetched
  }

  /**
   * @type {Object<String, SpeechSynthesisVoice>}
   */
  get americanVoices() {
    return this.chain
      .get('voices')
      .pickBy(v => v.lang === 'en-US')
      .value()
  }

  get randomEnglish() {
    return this.chain
      .get('voices')
      .filter(({ lang }) => lang.startsWith('en'))
      .shuffle()
      .first()
      .value()
  }

  get someRando() {
    return (
      this.chain
        .get('voices')
        .values()
        .shuffle()
        .last()
        .get('name')
        .value() || this.defaultVoice
    )
  }

  get someRandomAmerican() {
    return (
      this.chain
        .get('americanVoices')
        .values()
        .shuffle()
        .last()
        .get('name')
        .value() || this.defaultVoice
    )
  }

  /**
   * @type {SpeechSynthesisVoice}
   */
  get defaultVoice() {
    const voice = this.get('featureSettings.voice', 'alex')
    return this.voices[String(voice).toLowerCase()]
  }

  activate() {
    this.state.set('activated', true)
    return this
  }

  disable() {
    this.state.set('activated', false)
    return this
  }

  /**
   * @param {String} phrase what to say
   * @param {String|SpeechSynthesisVoice} inVoice the voice to use
   */
  say(phrase, inVoice = this.defaultVoice) {
    if (!this.state.get('activated')) {
      this.runtime.log('synth say', phrase)
      this.emit('saying', phrase)
      return
    }

    const utterance = new this.SpeechSynthesisUtterance(phrase)
    utterance.voice = typeof inVoice === 'string' ? this.voices[inVoice.toLowerCase()] : inVoice
    this.emit('saying', phrase)
    this.speechSynthesis.speak(utterance)
  }
}
