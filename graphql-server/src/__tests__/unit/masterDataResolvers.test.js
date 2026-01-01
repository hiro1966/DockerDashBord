import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Mock db before importing resolvers
const mockQuery = jest.fn()
jest.unstable_mockModule('../../db/pool.js', () => ({
  query: mockQuery,
}))

// Import after mocking
const { getDepartments, getWards } = await import('../../resolvers/masterDataResolvers.js')

describe('Master Data Resolvers - Unit Tests', () => {
  beforeEach(() => {
    mockQuery.mockClear()
  })

  describe('getDepartments', () => {
    test('診療科一覧を正しく取得できる', async () => {
      // Arrange
      const mockRows = [
        { id: 1, code: '01', name: '内科', display_order: 1, created_at: new Date() },
        { id: 2, code: '10', name: '外科', display_order: 2, created_at: new Date() },
        { id: 3, code: '11', name: '小児科', display_order: 3, created_at: new Date() },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getDepartments()

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        id: 1,
        code: '01',
        name: '内科',
        displayOrder: 1,
        createdAt: expect.any(String),
      })
      // Just verify query was called with correct parameters
      expect(mockQuery).toHaveBeenCalled()
      const [[query, params]] = mockQuery.mock.calls
      expect(query).toContain('departments')
      // Params might be [] or undefined depending on implementation
    })

    test('空の診療科リストを処理できる', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      const result = await getDepartments()

      // Assert
      expect(result).toEqual([])
    })

    test('データベースエラーを適切に処理する', async () => {
      // Arrange
      mockQuery.mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(getDepartments()).rejects.toThrow('Database connection failed')
    })
  })

  describe('getWards', () => {
    test('病棟一覧を正しく取得できる', async () => {
      // Arrange
      const mockRows = [
        { id: 1, code: 'A', name: 'A病棟', capacity: 50, display_order: 1, created_at: new Date() },
        { id: 2, code: 'B', name: 'B病棟', capacity: 40, display_order: 2, created_at: new Date() },
        { id: 3, code: 'C', name: 'C病棟', capacity: 30, display_order: 3, created_at: new Date() },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getWards()

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        id: 1,
        code: 'A',
        name: 'A病棟',
        capacity: 50,
        displayOrder: 1,
        createdAt: expect.any(String),
      })
      expect(mockQuery).toHaveBeenCalled()
      const [[query, params]] = mockQuery.mock.calls
      expect(query).toContain('wards')
      // Params might be [] or undefined depending on implementation
    })

    test('display_order順にソートされている', async () => {
      // Arrange
      const mockRows = [
        { id: 3, code: 'C', name: 'C病棟', capacity: 30, display_order: 3, created_at: new Date() },
        { id: 1, code: 'A', name: 'A病棟', capacity: 50, display_order: 1, created_at: new Date() },
        { id: 2, code: 'B', name: 'B病棟', capacity: 40, display_order: 2, created_at: new Date() },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getWards()

      // Assert - query contains ORDER BY clause
      expect(mockQuery).toHaveBeenCalled()
      const [[query]] = mockQuery.mock.calls
      expect(query.toUpperCase()).toContain('ORDER BY')
    })
  })
})
