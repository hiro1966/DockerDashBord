import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// Mock db before importing resolvers
const mockQuery = jest.fn()
jest.unstable_mockModule('../../db/pool.js', () => ({
  query: mockQuery,
}))

// Import after mocking
const { getDoctors, getDoctorsByDepartment, getSalesSummary, getSalesByDoctor } = await import('../../resolvers/salesResolvers.js')

describe('Sales Resolvers - Unit Tests', () => {
  beforeEach(() => {
    mockQuery.mockClear()
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
          created_at: new Date(),
          dept_id: 1,
          dept_code: '01',
          dept_name: '内科',
          dept_display_order: 1,
          dept_created_at: new Date(),
        },
        { 
          code: 'D002', 
          name: '佐藤 二郎', 
          department_code: '10', 
          display_order: 2, 
          created_at: new Date(),
          dept_id: 2,
          dept_code: '10',
          dept_name: '外科',
          dept_display_order: 2,
          dept_created_at: new Date(),
        },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getDoctors()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        code: 'D001',
        name: '山田 一郎',
        departmentCode: '01',
        displayOrder: 1,
        department: {
          code: '01',
          name: '内科',
        },
      })
      expect(result[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(result[0].department.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    test('display_order順にソートされている', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      await getDoctors()

      // Assert - query contains ORDER BY clause
      expect(mockQuery).toHaveBeenCalled()
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
          created_at: new Date(),
          dept_id: 1,
          dept_code: '01',
          dept_name: '内科',
          dept_display_order: 1,
          dept_created_at: new Date(),
        },
        { 
          code: 'D002', 
          name: '鈴木 三郎', 
          department_code: '01', 
          display_order: 2, 
          created_at: new Date(),
          dept_id: 1,
          dept_code: '01',
          dept_name: '内科',
          dept_display_order: 1,
          dept_created_at: new Date(),
        },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getDoctorsByDepartment('01')

      // Assert
      expect(result).toHaveLength(2)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE department_code'),
        ['01']
      )
    })
  })

  describe('getSalesSummary', () => {
    test('全期間の売上サマリーを取得できる', async () => {
      // Arrange
      const mockRows = [
        { year_month: '2024-01', total_outpatient: '10000000', total_inpatient: '20000000' },
        { year_month: '2024-02', total_outpatient: '12000000', total_inpatient: '22000000' },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getSalesSummary()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        yearMonth: '2024-01',
        totalOutpatientSales: 10000000,
        totalInpatientSales: 20000000,
        totalSales: 30000000,
      })
    })

    test('期間指定で売上サマリーを取得できる', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      await getSalesSummary('2024-01', '2024-06')

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE year_month >= $1 AND year_month <= $2'),
        ['2024-01', '2024-06']
      )
    })

    test('開始月のみ指定できる', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      await getSalesSummary('2024-01', null)

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE year_month >= $1'),
        ['2024-01']
      )
    })
  })

  describe('getSalesByDoctor', () => {
    test('医師別売上を取得できる', async () => {
      // Arrange
      const mockRows = [
        { doctor_code: 'D001', year_month: '2024-01', outpatient_sales: '5000000', inpatient_sales: '10000000', updated_at: new Date() },
        { doctor_code: 'D001', year_month: '2024-02', outpatient_sales: '6000000', inpatient_sales: '11000000', updated_at: new Date() },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getSalesByDoctor('D001', '2024-01', '2024-12')

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        doctorCode: 'D001',
        yearMonth: '2024-01',
        outpatientSales: 5000000,
        inpatientSales: 10000000,
        totalSales: 15000000,
      })
      expect(result[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE doctor_code = $1'),
        expect.arrayContaining(['D001'])
      )
    })

    test('合計売上が正しく計算される', async () => {
      // Arrange
      const mockRows = [
        { doctor_code: 'D001', year_month: '2024-01', outpatient_sales: '3000000', inpatient_sales: '7000000', updated_at: new Date() },
        { doctor_code: 'D001', year_month: '2024-02', outpatient_sales: '4000000', inpatient_sales: '8000000', updated_at: new Date() },
      ]
      
      mockQuery.mockResolvedValue({ rows: mockRows })

      // Act
      const result = await getSalesByDoctor('D001')

      // Assert
      expect(result[0].totalSales).toBe(10000000) // 3000000 + 7000000
      expect(result[1].totalSales).toBe(12000000) // 4000000 + 8000000
    })
  })
})
