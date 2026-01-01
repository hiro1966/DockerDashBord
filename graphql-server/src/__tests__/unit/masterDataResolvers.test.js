import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import * as masterDataResolvers from '../../resolvers/masterDataResolvers.js'
import * as db from '../../db/pool.js'

// データベースモックをセットアップ
jest.mock('../../db/pool.js')

describe('Master Data Resolvers - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDepartments', () => {
    test('診療科一覧を正しく取得できる', async () => {
      // Arrange
      const mockRows = [
        {
          id: 1,
          code: '01',
          name: '内科',
          display_order: 1,
          created_at: new Date('2024-01-01'),
        },
        {
          id: 2,
          code: '10',
          name: '小児科',
          display_order: 2,
          created_at: new Date('2024-01-01'),
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await masterDataResolvers.getDepartments()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        code: '01',
        name: '内科',
        displayOrder: 1,
        createdAt: expect.any(String),
      })
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, code, name, display_order, created_at FROM departments')
      )
    })

    test('空の診療科リストを処理できる', async () => {
      // Arrange
      db.query.mockResolvedValue({ rows: [] })

      // Act
      const result = await masterDataResolvers.getDepartments()

      // Assert
      expect(result).toEqual([])
    })

    test('データベースエラーを適切に処理する', async () => {
      // Arrange
      db.query.mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(masterDataResolvers.getDepartments()).rejects.toThrow('Database connection failed')
    })
  })

  describe('getWards', () => {
    test('病棟一覧を正しく取得できる', async () => {
      // Arrange
      const mockRows = [
        {
          id: 1,
          code: '003',
          name: '3階病棟',
          capacity: 50,
          display_order: 1,
          created_at: new Date('2024-01-01'),
        },
        {
          id: 2,
          code: '004',
          name: '4階病棟',
          capacity: 45,
          display_order: 2,
          created_at: new Date('2024-01-01'),
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await masterDataResolvers.getWards()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        code: '003',
        name: '3階病棟',
        capacity: 50,
        displayOrder: 1,
        createdAt: expect.any(String),
      })
      expect(result[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    test('display_order順にソートされている', async () => {
      // Arrange
      const mockRows = [
        { id: 2, code: '004', name: '4階病棟', capacity: 45, display_order: 2, created_at: new Date() },
        { id: 1, code: '003', name: '3階病棟', capacity: 50, display_order: 1, created_at: new Date() },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await masterDataResolvers.getWards()

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY display_order, code')
      )
    })
  })
})
