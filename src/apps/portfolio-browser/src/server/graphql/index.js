import { ApolloServer } from 'apollo-server-express'
import cookieParser from 'cookie-parser'
import { typeDefs } from './typeDefs'
import { resolve } from './resolvers'

/**
 * @this {Server}
 */
export default async function attach(app, portfolio) {
  const { runtime } = this

  app.use(cookieParser())

  const resolverModules = runtime.fsx.readdirSync(
    runtime.resolve('src', 'server', 'graphql', 'resolvers')
  )

  resolverModules.forEach(mod => {
    require(runtime.resolve('src', 'server', 'graphql', 'resolvers', mod))(resolve, this)
  })

  const resolvers = resolve.value()

  console.log(resolvers)

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      return {
        authTokens: req.cookies,
        runtime,
        packageManager: portfolio.packageManager,
        fileManager: portfolio.fileManager,
        moduleManager: portfolio.moduleManager,
        portfolio,
      }
    },
  })

  apollo.applyMiddleware({
    app,
    path: `/graphql`,
    cors: true,
    bodyParser: true,
  })

  return app
}
