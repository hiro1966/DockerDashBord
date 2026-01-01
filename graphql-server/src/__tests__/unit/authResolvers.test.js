import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import * as authResolvers from '../../resolvers/authResolvers.js'
import * as db from '../../db/pool.js'

jest.mock('../../db/pool.js')

describe('Auth Resolvers - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      
      db.query.mockResolvedValue({ rows: [mockRow] })

      // Act
      const result = await authResolvers.verifyStaff('admin001')

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
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM staff s'),
        ['admin001']
      )
    })

    test('存在しない職員IDでnullを返す', async () => {
      // Arrange
      db.query.mockResolvedValue({ rows: [] })

      // Act
      const result = await authResolvers.verifyStaff('invalid_id')

      // Assert
      expect(result).toBeNull()
    })

    test('権限情報が正しく含まれている', async () => {
      // Arrange
      const mockRow = {
        id: 'doctor001',
        name: '山田 一郎',
        job_type_code: '10',
        job_type_name: '医師',
        level: 10,
        created_at: new Date('2024-01-01'),
      }
      
      db.query.mockResolvedValue({ rows: [mockRow] })

      // Act
      const result = await authResolvers.verifyStaff('doctor001')

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
      db.query.mockResolvedValue({ rows: [] })

      // Act
      await authResolvers.verifyStaff(maliciousId)

      // Assert
      // パラメータ化されたクエリを使用していることを確認
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [maliciousId]
      )
    })
  })
})
