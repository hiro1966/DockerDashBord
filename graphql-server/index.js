import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'node:http'
import { typeDefs } from './src/schema/typeDefs.js'
import { resolvers } from './src/resolvers/index.js'
import { closePool } from './src/db/pool.js'

// Yogaサーバー作成
export const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  cors: {
    origin: '*',
    credentials: true,
  },
  graphiql: {
    title: 'Hospital Dashboard GraphQL API',
  },
})

// HTTPサーバー作成
export const server = createServer(yoga)

const PORT = process.env.PORT || 4000

// サーバー起動
export const startServer = () => {
  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`🚀 GraphQL Server is running on http://localhost:${PORT}/graphql`)
      resolve(server)
    })
  })
}

// グレースフルシャットダウン
const shutdown = async () => {
  console.log('Shutting down gracefully...')
  
  await closePool()
  
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// このファイルが直接実行された場合のみサーバーを起動
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}
