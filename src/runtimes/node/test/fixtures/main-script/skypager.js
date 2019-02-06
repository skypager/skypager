skypager.setState({
  mainScriptSideEffects: true,
})

const sleep = (ms = 4400) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  async attach(runtime = skypager) {
    runtime.setState({ attachMainScript: true })
  },
  async start(runtime = skypager) {
    await sleep(2000)
    runtime.setState({ startHookFinished: true })
    console.log('YO YO!')
  },
}
