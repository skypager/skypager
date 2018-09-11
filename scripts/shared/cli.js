const runtime = require('@skypager/node')
const { print, clear, randomBanner, prompt } = runtime.cli

exports = module.exports = runtime.cli

exports.showHeader = function showHeader() {
  clear()
  randomBanner('Skypager')
}

/**
 *
 * @param {Array} appNames - a list of app names which will be presented to the
 * developer to select from. Will return the name of the app which can be used
 * by runtime.packageManager
 */
exports.selectApplication = async function selectApplication(appNames = []) {
  print(`Select an application to start developing:`, 0, 2, 1)
  print(appNames.map((name, i) => `${i + 1}) ${name}`), 4)
  const response = await runtime.cli.ask({
    appName: {
      description: `\n\nSelection: `,
    },
  })

  return appNames[parseInt(response.appName, 10) - 1]
}

function present(schema, prompt) {
  return new Promise((resolve, reject) => {
    prompt.get({ properties: schema }, (err, results) => (err ? reject(err) : resolve(results)))
  })
}

prompt.stop = function() {
  if (prompt.stopped || !prompt.started) {
    return
  }

  process.stdin.destroy()
  prompt.emit('stop')
  prompt.stopped = true
  prompt.started = false
  prompt.paused = false
  return prompt
}
