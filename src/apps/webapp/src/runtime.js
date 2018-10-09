import skypager from '@skypager/web'

skypager.clients.register('app', () => require('./client'))

global.sheetsClient = skypager.client('app')

export default skypager
