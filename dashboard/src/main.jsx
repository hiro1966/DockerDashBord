import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client'
import App from './App'
import './index.css'

// GraphQL URLを動的に設定
// 環境変数が設定されていればそれを使用、なければ現在のホストを使用
const getGraphQLUrl = () => {
  if (import.meta.env.VITE_GRAPHQL_URL) {
    return import.meta.env.VITE_GRAPHQL_URL
  }
  
  // Nginxリバースプロキシを使用する場合（推奨）
  // ダッシュボードと同じホスト・ポートで /graphql パスにアクセス
  const protocol = window.location.protocol
  const host = window.location.host  // hostname + port
  return `${protocol}//${host}/graphql`
}

const httpLink = new HttpLink({
  uri: getGraphQLUrl(),
})

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})

console.log('GraphQL Server URL:', getGraphQLUrl())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)

