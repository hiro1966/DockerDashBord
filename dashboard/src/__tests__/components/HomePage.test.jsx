import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TestProviders } from '../../test/TestProviders'
import HomePage from '../../pages/HomePage'
import { GET_OUTPATIENT_SUMMARY, GET_INPATIENT_SUMMARY } from '../../queries'

// React Routerのモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

describe('HomePage Component', () => {
  const mockOutpatientData = {
    request: {
      query: GET_OUTPATIENT_SUMMARY,
      variables: {
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
    },
    result: {
      data: {
        outpatientSummary: [
          {
            date: '2024-01-01',
            totalNew: 50,
            totalReturning: 150,
            totalPatients: 200,
          },
          {
            date: '2024-01-02',
            totalNew: 60,
            totalReturning: 160,
            totalPatients: 220,
          },
        ],
      },
    },
  }

  const mockInpatientData = {
    request: {
      query: GET_INPATIENT_SUMMARY,
      variables: {
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
    },
    result: {
      data: {
        inpatientSummary: [
          {
            date: '2024-01-01',
            totalCurrent: 100,
            totalNewAdmission: 10,
            totalDischarge: 8,
            totalTransferOut: 2,
            totalTransferIn: 3,
          },
        ],
      },
    },
  }

  test('ページタイトルが表示される', async () => {
    // Arrange & Act
    render(
      <TestProviders mocks={[mockOutpatientData, mockInpatientData]}>
        <HomePage />
      </TestProviders>
    )

    // Assert
    expect(screen.getByText(/病院管理ダッシュボード/i)).toBeInTheDocument()
  })

  test('外来と入院のセクションが表示される', async () => {
    // Arrange & Act
    render(
      <TestProviders mocks={[mockOutpatientData, mockInpatientData]}>
        <HomePage />
      </TestProviders>
    )

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/外来患者数/i)).toBeInTheDocument()
      expect(screen.getByText(/入院患者数/i)).toBeInTheDocument()
    })
  })

  test('ローディング状態が表示される', () => {
    // Arrange & Act
    render(
      <TestProviders mocks={[]}>
        <HomePage />
      </TestProviders>
    )

    // Assert
    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument()
  })

  test('詳細ページへのリンクが存在する', async () => {
    // Arrange & Act
    render(
      <TestProviders mocks={[mockOutpatientData, mockInpatientData]}>
        <HomePage />
      </TestProviders>
    )

    // Assert
    await waitFor(() => {
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })
})
