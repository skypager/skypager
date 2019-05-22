import { Feature } from '@skypager/runtime'

export default class VoiceSynthesis extends Feature {
  get lang() {
    return 'en-US'
  }

  get synth() {
    return window.speechSynthesis
  }

  get voices() {
    const voices = this.synth
    const { keyBy, filter } = this.lodash
    return keyBy(filter(voices, { lang: this.lang }), ({ name }) => name.toLowerCase())
  }

  get defaultVoice() {
    return Object.values(this.voices)[0]
  }

  speak(phrase, voice) {
    const utterance = new SpeechSynthesisUtterance(phrase)
    utterance.voice = this.voices[voice] || this.defaultVoice
    return this.synth.speak(utterance)
  }
}
