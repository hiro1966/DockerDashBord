import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { yoga } from '../../../index_new.js'

describe('GraphQL API - Integration Tests', () => {
  describe('Master Data Queries', () => {
    test('departments クエリが動作する', async () => {
      // Arrange
      const query = `
        query {
          departments {
            id
            code
            name
            displayOrder
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.errors).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data.departments).toBeInstanceOf(Array)
    })

    test('wards クエリが動作する', async () => {
      // Arrange
      const query = `
        query {
          wards {
            id
            code
            name
            capacity
            displayOrder
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.data.wards).toBeInstanceOf(Array)
      if (result.data.wards.length > 0) {
        expect(result.data.wards[0]).toHaveProperty('code')
        expect(result.data.wards[0]).toHaveProperty('name')
        expect(result.data.wards[0]).toHaveProperty('capacity')
      }
    })
  })

  describe('Authentication Queries', () => {
    test('verifyStaff クエリで有効な職員を認証できる', async () => {
      // Arrange
      const query = `
        query VerifyStaff($staffId: String!) {
          verifyStaff(staffId: $staffId) {
            id
            name
            jobTypeCode
            permission {
              jobTypeCode
              jobTypeName
              level
            }
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { staffId: 'admin001' },
        }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      if (result.data.verifyStaff) {
        expect(result.data.verifyStaff).toHaveProperty('id')
        expect(result.data.verifyStaff).toHaveProperty('name')
        expect(result.data.verifyStaff.permission).toHaveProperty('level')
      }
    })

    test('verifyStaff クエリで存在しない職員はnullを返す', async () => {
      // Arrange
      const query = `
        query VerifyStaff($staffId: String!) {
          verifyStaff(staffId: $staffId) {
            id
            name
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { staffId: 'invalid_staff_id_12345' },
        }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.data.verifyStaff).toBeNull()
    })
  })

  describe('Sales Queries', () => {
    test('doctors クエリが動作する', async () => {
      // Arrange
      const query = `
        query {
          doctors {
            code
            name
            departmentCode
            displayOrder
            department {
              code
              name
            }
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.data.doctors).toBeInstanceOf(Array)
      if (result.data.doctors.length > 0) {
        expect(result.data.doctors[0]).toHaveProperty('code')
        expect(result.data.doctors[0]).toHaveProperty('name')
        expect(result.data.doctors[0].department).toHaveProperty('code')
      }
    })

    test('doctorsByDepartment クエリが動作する', async () => {
      // Arrange
      const query = `
        query GetDoctorsByDepartment($departmentCode: String!) {
          doctorsByDepartment(departmentCode: $departmentCode) {
            code
            name
            departmentCode
            displayOrder
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { departmentCode: '01' },
        }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.data.doctorsByDepartment).toBeInstanceOf(Array)
    })

    test('salesSummary クエリが動作する', async () => {
      // Arrange
      const query = `
        query GetSalesSummary($startMonth: String, $endMonth: String) {
          salesSummary(startMonth: $startMonth, endMonth: $endMonth) {
            yearMonth
            totalOutpatientSales
            totalInpatientSales
            totalSales
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            startMonth: '2024-01',
            endMonth: '2024-12',
          },
        }),
      })

      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.data.salesSummary).toBeInstanceOf(Array)
      if (result.data.salesSummary.length > 0) {
        expect(result.data.salesSummary[0]).toHaveProperty('yearMonth')
        expect(result.data.salesSummary[0]).toHaveProperty('totalSales')
      }
    })
  })

  describe('Error Handling', () => {
    test('無効なクエリでエラーを返す', async () => {
      // Arrange
      const query = `
        query {
          nonExistentQuery {
            field
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      // Assert
      expect(result.errors).toBeDefined()
      expect(result.errors[0].message).toContain('Cannot query field')
    })

    test('必須パラメータなしでエラーを返す', async () => {
      // Arrange
      const query = `
        query {
          verifyStaff {
            id
          }
        }
      `

      // Act
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      // Assert
      expect(result.errors).toBeDefined()
    })
  })
})
