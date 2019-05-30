import { Feature } from '@skypager/runtime'

export default class Commander extends Feature {
  static shortcut = 'voiceCommander'
  static isCacheable = true
  static enableStrictMode = false
  static strictMode = false

  initialState = {
    recognitionEnabled: false,
    synthesisEnabled: false,
    running: false,
  }

  observables() {
    return {
      commands: ['shallowMap', {}],
      receiveCommand: ['action', this.receiveCommand],
      updateCommand: ['action', this.updateCommand],
      commandState: ['computed', this.getCommandState],
      commandInfo: ['computed', this.getCommandInfo],
    }
  }

  start(options = {}) {
    const disposer = this.speech.listen({
      ...options,
      clear: true,
      onComplete: this.receiveCommand.bind(this),
    })

    return (this.disposer = disposer)
  }

  stop() {
    this.disposer && this.disposer()
    return this
  }

  getCommandState() {
    const { current, commands, index } = this.commandInfo
    const previous = commands[index - 1]

    const base = {
      ...(previous && { previous: previous.update || {}, previousCommandId: previous.commandId }),
      index,
      current,
      state: this.currentState,
      commandsCount: commands.length,
      waiting: !!(!commands.length || commands[index + 1] || index === commands.length),
    }

    return {
      ...base,
      needsProcessing: current && !current.completed,
    }
  }

  getCommandInfo() {
    const commands = this.commands.values()
    const current = commands.find(({ completed }) => !completed)

    if (!commands.length) {
      return {
        index: 0,
        current: undefined,
        commands: [],
      }
    }

    if (!current) {
      return {
        index: commands.length,
        current: commands[commands.length - 1],
        commands,
      }
    }

    const index = commands.map(c => c.commandId).indexOf(current.commandId)

    return {
      index,
      current,
      commands,
    }
  }

  clear() {
    this.commands.keys().forEach(key => this.commands.delete(key))
    return this
  }

  get currentCommand() {
    const commands = this.commands.values()
    return commands.find(({ completed }) => !completed) || commands[commands.length - 1]
  }

  get previousCommand() {
    const { currentCommand } = this
    const commands = this.commands.values()

    if (!currentCommand) {
      return
    }

    if (commands.length === 1) {
      return commands[0]
    }

    const index = commands.map(c => c.commandId).indexOf(currentCommand.commandId)
    return commands[index - 1]
  }

  async process(handle) {
    handle = handle || this.lodash.identity

    const { currentCommand } = this

    if (!currentCommand) {
      return
    }

    const { commandId } = currentCommand
    const commands = this.commands.values()
    const index = commands.map(c => c.commandId).indexOf(commandId)

    const result = await handle.call(
      this,
      currentCommand,
      this.commandState,
      commands,
      index,
      commandId
    )
    const { update = {} } = result

    if (result) {
      this.updateCommand(commandId, {
        update,
        completed: true,
        processing: false,
      })
      this.state.set('current', update)
    }

    return this.commands.get(commandId)
  }

  updateCommand(commandId, attributes = {}) {
    this.commands.set(commandId, {
      commandId,
      ...(this.commands.get(commandId) || {}),
      ...attributes,
    })
  }

  receiveCommand(command) {
    command = String(command).trim()

    const { uniqueId } = this.lodash
    const parser = this.nlp(command)

    if (!this.commands.values().length) {
      this.state.set('current', {})
    }

    const isQuestion = !!parser.sentences().isQuestion().length

    const nouns = parser.nouns().data()
    const words = parser.words().data()
    const adjectives = parser.adjectives().data()
    const adverbs = parser.adverbs().data()
    const dates = parser.dates().data()
    const verbs = parser.verbs().data()
    const values = parser.values().data()

    const infinitives = verbs
      .filter(({ normal }) => String(normal).toLowerCase() !== "let's")
      .map(({ conjugations }) => conjugations.Infinitive)

    const questions = !isQuestion ? [] : words.slice(0, 1).map(w => w.normal)

    const data = {
      command,
      isQuestion,
      nouns,
      verbs,
      values,
      dates,
      adverbs,
      adjectives,
      structured: questions
        .concat(infinitives)
        .concat(nouns.map(n => n.normal))
        .map(v => String(v).trim()),
    }

    const commandId = uniqueId('command')

    const parsed = {
      ...(this.commands.get(commandId) || {}),
      ...data,
      commandId,
      timestamp: Date.now(),
    }

    this.commands.set(commandId, parsed)

    this.emit('receivedCommand', this.commands.get('commandId'), this.commandState)
    this.state.set('commandsCount', this.commands.keys().length)

    return parsed
  }

  get speech() {
    return this.runtime.feature('speech-recognition')
  }

  get synth() {
    return this.runtime.feature('voice-synthesis')
  }

  async enable(options) {
    console.log('enabling', this.options, this.options.handler, this.tryGet('handler'))

    try {
      await this.speech.enable(options)
      await this.synth.enable(options)
    } catch (error) {
      console.error('error enabling synth', error)
    }

    this.state.set('recognitionEnabled', this.speech.isSupported)
    this.state.set('synthesisEnabled', this.synth.isSupported)

    const { nlp } = await this.runtime.assetLoader.unpkg({
      nlp: 'compromise@latest/builds/compromise.min.js',
    })

    this.speech.on('listeningDidChangeState', ({ newValue }) => {
      this.state.set('listening', newValue)
    })

    this.nlp = nlp
  }
}
