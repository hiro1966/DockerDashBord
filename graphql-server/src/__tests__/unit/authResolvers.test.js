import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Mock db before importing resolvers
const mockQuery = jest.fn()
jest.unstable_mockModule('../../db/pool.js', () => ({
  query: mockQuery,
}))

// Import after mocking
const { verifyStaff } = await import('../../resolvers/authResolvers.js')

describe('Auth Resolvers - Unit Tests', () => {
  beforeEach(() => {
    mockQuery.mockClear()
  })

  describe('verifyStaff', () => {
    test('有効な職員IDで職員情報を取得できる', async () => {
      // Arrange
      const mockRow = {
        id: 'admin001',
        name: '管理者 太郎',
        job_type_code: '90',
        job_type_name: 'システム管理者',
        level: 99,
        created_at: new Date('2024-01-01'),
      }
      
      mockQuery.mockResolvedValue({ rows: [mockRow] })

      // Act
      const result = await verifyStaff('admin001')

      // Assert
      expect(result).toEqual({
        id: 'admin001',
        name: '管理者 太郎',
        jobTypeCode: '90',
        permission: {
          jobTypeCode: '90',
          jobTypeName: 'システム管理者',
          level: 99,
        },
        createdAt: expect.any(String),
      })
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM staff s'),
        ['admin001']
      )
    })

    test('存在しない職員IDでnullを返す', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      const result = await verifyStaff('invalid_id')

      // Assert
      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM staff s'),
        ['invalid_id']
      )
    })

    test('権限情報が正しく含まれている', async () => {
      // Arrange
      const mockRow = {
        id: 'doctor001',
        name: '医師 一郎',
        job_type_code: '10',
        job_type_name: '医師',
        level: 10,
        created_at: new Date('2024-01-01'),
      }
      
      mockQuery.mockResolvedValue({ rows: [mockRow] })

      // Act
      const result = await verifyStaff('doctor001')

      // Assert
      expect(result.permission).toEqual({
        jobTypeCode: '10',
        jobTypeName: '医師',
        level: 10,
      })
    })

    test('SQLインジェクション攻撃を防ぐ', async () => {
      // Arrange
      const maliciousId = "admin' OR '1'='1"
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      await verifyStaff(maliciousId)

      // Assert - パラメータ化されたクエリを使用していることを確認
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [maliciousId] // パラメータとして渡されている
      )
    })
  })
})
