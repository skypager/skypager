const runtime = require('@skypager/node').use(require('..'))

runtime.redis.subscribe('testChannel', (channel, message) => {
  console.log({ channel, message })
})
