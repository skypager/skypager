import { Feature, features, FeatureState, FeatureOptions } from "../feature.js";
import { Container, ContainerContext } from "../container.js";

interface SpeechOptions extends FeatureOptions {
  voice?: string;
}

interface SpeechState extends FeatureState {
  defaultVoice: string;
  voices?: Voice[];
}

type Voice = {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
};

export class Speech<
  T extends SpeechState = SpeechState,
  K extends SpeechOptions = SpeechOptions
> extends Feature<T, K> {

  static attach(container: Container & { speech?: Speech }) {
    container.features.register("speech", Speech);
  }

  override get shortcut() {
    return "speech" as const;
  }
  
  constructor(options: K, context: ContainerContext) {
    super(options,context)  

    if(options.voice) {
      this.state.set("defaultVoice", options.voice)
    }

    this.loadVoices()
  }
  
  get voices() {
    return this.state.get('voices') || [] 
  }
  
  get defaultVoice() {
    return this.voices.find(v => v.name === this.state.get("defaultVoice"))
  }

  loadVoices() {
    const voices = speechSynthesis.getVoices();
    this.state.set("voices", voices);

    if (!this.state.get("defaultVoice") && voices.length > 0) {
      const defaultVoice = voices.find(v => v.default)!
      this.state.set("defaultVoice", defaultVoice.name);
    }
  }

  setDefaultVoice(name: string) {
    const voice = this.voices.find(v => v.name === name)!
    this.state.set("defaultVoice", voice.name);
  }
  
  cancel() {
    speechSynthesis.cancel()
    return this
  }

  say(text: string, options: { voice?: Voice } = {}) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = options.voice || this.defaultVoice 
    utterance.voice = voice || this.voices[0]! 
    speechSynthesis.speak(utterance);
  }
}

export default features.register("speech", Speech);