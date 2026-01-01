import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { BrowserRouter } from 'react-router-dom'

/**
 * テスト用のプロバイダーラッパー
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @param {Array} props.mocks - Apollo Clientのモック
 * @param {Object} props.initialEntries - React Routerの初期エントリー
 */
export const TestProviders = ({ children, mocks = [], initialEntries = ['/'] }) => {
  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </MockedProvider>
  )
}

export default TestProviders
