import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import * as salesResolvers from '../../resolvers/salesResolvers.js'
import * as db from '../../db/pool.js'

jest.mock('../../db/pool.js')

describe('Sales Resolvers - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDoctors', () => {
    test('医師一覧を診療科情報付きで取得できる', async () => {
      // Arrange
      const mockRows = [
        {
          code: 'D001',
          name: '山田 一郎',
          department_code: '01',
          display_order: 1,
          created_at: new Date('2024-01-01'),
          dept_id: 1,
          dept_code: '01',
          dept_name: '内科',
          dept_display_order: 1,
          dept_created_at: new Date('2024-01-01'),
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await salesResolvers.getDoctors()

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        code: 'D001',
        name: '山田 一郎',
        departmentCode: '01',
        displayOrder: 1,
        department: {
          id: 1,
          code: '01',
          name: '内科',
          displayOrder: 1,
          createdAt: expect.any(String),
        },
        createdAt: expect.any(String),
      })
    })

    test('display_order順にソートされている', async () => {
      // Arrange
      db.query.mockResolvedValue({ rows: [] })

      // Act
      await salesResolvers.getDoctors()

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY dept.display_order, dept.code, d.display_order, d.name')
      )
    })
  })

  describe('getDoctorsByDepartment', () => {
    test('指定診療科の医師一覧を取得できる', async () => {
      // Arrange
      const mockRows = [
        {
          code: 'D001',
          name: '山田 一郎',
          department_code: '01',
          display_order: 1,
          created_at: new Date('2024-01-01'),
        },
        {
          code: 'D002',
          name: '佐藤 次郎',
          department_code: '01',
          display_order: 2,
          created_at: new Date('2024-01-01'),
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await salesResolvers.getDoctorsByDepartment('01')

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('D001')
      expect(result[1].code).toBe('D002')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE department_code = $1'),
        ['01']
      )
    })
  })

  describe('getSalesSummary', () => {
    test('全期間の売上サマリーを取得できる', async () => {
      // Arrange
      const mockRows = [
        {
          year_month: '2024-01',
          total_outpatient: '1000000',
          total_inpatient: '2000000',
        },
        {
          year_month: '2024-02',
          total_outpatient: '1100000',
          total_inpatient: '2100000',
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await salesResolvers.getSalesSummary()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        yearMonth: '2024-01',
        totalOutpatientSales: 1000000,
        totalInpatientSales: 2000000,
        totalSales: 3000000,
      })
    })

    test('期間指定で売上サマリーを取得できる', async () => {
      // Arrange
      db.query.mockResolvedValue({ rows: [] })

      // Act
      await salesResolvers.getSalesSummary('2024-01', '2024-06')

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        ['2024-01', '2024-06']
      )
    })

    test('開始月のみ指定できる', async () => {
      // Arrange
      db.query.mockResolvedValue({ rows: [] })

      // Act
      await salesResolvers.getSalesSummary('2024-01', null)

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('year_month >= $1'),
        ['2024-01']
      )
    })
  })

  describe('getSalesByDoctor', () => {
    test('医師別売上を取得できる', async () => {
      // Arrange
      const mockRows = [
        {
          doctor_code: 'D001',
          year_month: '2024-01',
          outpatient_sales: '500000',
          inpatient_sales: '1000000',
          updated_at: new Date('2024-01-31'),
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await salesResolvers.getSalesByDoctor('D001', '2024-01', '2024-12')

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        doctorCode: 'D001',
        yearMonth: '2024-01',
        outpatientSales: 500000,
        inpatientSales: 1000000,
        totalSales: 1500000,
        updatedAt: expect.any(String),
      })
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE doctor_code = $1'),
        ['D001', '2024-01', '2024-12']
      )
    })

    test('合計売上が正しく計算される', async () => {
      // Arrange
      const mockRows = [
        {
          doctor_code: 'D001',
          year_month: '2024-01',
          outpatient_sales: '123456',
          inpatient_sales: '654321',
          updated_at: new Date('2024-01-31'),
        },
      ]
      
      db.query.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await salesResolvers.getSalesByDoctor('D001')

      // Assert
      expect(result[0].totalSales).toBe(777777)
    })
  })
})
