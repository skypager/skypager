import runtime from '@skypager/node'
import * as fileDb from '../../src'

const ctx = require.context('./collections', true, /\.js$/)
ctx.resolve = k => k

export const collections = runtime.Helper.createContextRegistry('collections', {
  context: runtime.Helper.createMockContext({}),
  formatId: id => id.replace(/^\W+/g, '').replace(/\.js$/, ''),
})

collections.add(ctx)

export default runtime.use(fileDb).use(next => {
  Object.entries(collections.allMembers()).forEach(([name, mod]) => {
    runtime.lazy(name, () =>
      runtime.feature('file-db/collection', {
        ...mod,
        dbName: name,
        dbAutoload: true,
      })
    )
  })
  next()
})
