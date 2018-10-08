export const command = 'runner'

export const help = 'Select which code runner to use'

export function action(arg) {
  const { repl } = this

  if (!arg) {
    console.log()
    console.log('Available RUnners', this.runners.available)
    console.log()
  } else if (typeof arg === 'string' && this.runners.checkKey(arg) !== false) {
    this.currentCodeRunner = arg
  }

  repl.displayPrompt()
}
