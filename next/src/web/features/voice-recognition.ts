import { Feature, FeatureOptions, FeatureState, features } from "../../feature.js";
import { WebFeatures, Container, ContainerContext } from '../container.js'

export interface VoiceRecognitionOptions extends FeatureOptions {
  language?: string;
  continuous?: boolean;
  autoListen?: boolean;
}

export interface VoiceRecognitionState extends FeatureState {
  listening: boolean;
  transcript: string;
}

export class VoiceRecognition<T extends VoiceRecognitionState = VoiceRecognitionState, K extends VoiceRecognitionOptions = VoiceRecognitionOptions> extends Feature<T, K> {
  // @ts-ignore-next-line
  private recognition: SpeechRecognition | null = null;

  static attach(container: Container<WebFeatures> & { voice?: VoiceRecognition }, options?: VoiceRecognitionOptions) {
    container.features.register('voice', VoiceRecognition)
    container.feature('voice', { enable: true })
    return container
  }

  get shortcut() {
    return "voice" as const;
  }

  constructor(options: K, context: ContainerContext) {
    super(options, context);

    this.state.set("listening", false);
    this.state.set("transcript", "");

    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('Voice recognition is not supported in this browser.');
    }

    // @ts-ignore-next-line
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = this.options.language || "en-US";
    this.recognition.continuous = this.options.continuous || false;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.state.set("transcript", this.state.get("transcript") + transcript);
        } else {
          interimTranscript += transcript;
        }
      }
      this.emit("result", {
        finalTranscript: this.state.get("transcript"),
        interimTranscript
      });
    };

    this.recognition.onerror = (event: any) => {
      this.emit("error", event.error);
    };

    this.recognition.onend = () => {
      this.state.set("listening", false);
      this.emit("end");
    };
    
    if (options?.autoListen) {
      this.start()
    }
  }

  get listening() {
    return !!this.state.get("listening");
  }

  get transcript() {
    return this.state.get("transcript") || '';
  }
  
  async whenFinished() {
    if(!this.listening) {
      this.start()
    }

    return await this.waitFor("end").then(() => this.transcript)  
  }

  start() {
    this.state.set('transcript', '')

    if (!this.listening && this.recognition) {
      this.recognition.start();
      this.state.set("listening", true);
      this.emit("start");
    }
  }

  stop() {
    if (this.listening && this.recognition) {
      this.recognition.stop();
      this.state.set("listening", false);
      this.emit("stop");
    }
  }

  abort() {
    if (this.listening && this.recognition) {
      this.recognition.abort();
      this.state.set("listening", false);
      this.emit("abort");
    }
  }

  clearTranscript() {
    this.state.set("transcript", "");
  }
}

export default features.register("voice", VoiceRecognition);