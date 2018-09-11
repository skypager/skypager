const { skypager } = this

skypager.selectors.register('development/applications', () => skypager.currentModule.require('./src/selectors/development/applications'))
