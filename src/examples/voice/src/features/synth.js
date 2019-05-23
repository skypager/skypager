import { Feature } from '@skypager/runtime'

export default class SpeechSynthesis extends Feature {
  static shortcut = 'synth'
  /**
   * The feature is only supported if the apis are available or have been injected
  */
  get isSupported() {
    const { isFunction } = this.lodash

    const { 
      // make these dependencies injectable
      speechSynthesis = this.runtime.get('speechSynthesis', global.speechSynthesis), 
      SpeechSynthesisUtterance = this.runtime.get('SpeechSynthesisUtterance', global.SpeechSynthesisUtterance)
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
   * You can inject your own `speechSynthesis` and `SpeechSynthesisUtterance` if they're not available in the global scope 
  */
  featureWasEnabled(options = {}) {
    const { 
      lang = 'en-US', 
      speechSynthesis = this.runtime.speechSynthesis || global.speechSynthesis, 
      SpeechSynthesisUtterance = this.runtime.SpeechSynthesisUtterance || global.SpeechSynthesisUtterance,
      voices = []
    } = { ...this.options, ...options } 

    this.speechSynthesis = speechSynthesis
    this.SpeechSynthesisUtterance = SpeechSynthesisUtterance
  }

  get voices() {
    return this.chain.plant(this.speechSynthesis.getVoices()).keyBy((v) => v.name.toLowerCase()).value()
  }

  /**
   * @type {Object<String, SpeechSynthesisVoice>} 
  */
  get americanVoices() {
    return this.chain.get('voices').pickBy((v) => v.lang === 'en-US').value()
  }

  /**
   * @type {SpeechSynthesisVoice} 
  */
  get defaultVoice() {
    const voice = this.get('featureSettings.voice', 'alex') 
    return this.voices[String(voice).toLowerCase()] 
  }

  /**
   * @param {String} phrase what to say
   * @param {String|SpeechSynthesisVoice} inVoice the voice to use
  */
  say(phrase, inVoice = this.defaultVoice) {
    const utterance = new this.SpeechSynthesisUtterance(phrase)

    console.log('wanna use', inVoice)
    utterance.voice = typeof inVoice === 'string'
      ? this.voices[inVoice.toLowerCase()]
      : inVoice

    console.log('using voice', utterance.voice)

    this.speechSynthesis.speak(utterance)
  }
}