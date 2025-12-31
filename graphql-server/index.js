import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'http'
import pg from 'pg'

const { Pool } = pg

// PostgreSQL接続プール
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hospital_db',
  user: process.env.DB_USER || 'hospital_user',
  password: process.env.DB_PASSWORD || 'hospital_pass',
})

// GraphQLスキーマ定義
const typeDefs = `
  type Department {
    id: Int!
    code: String!
    name: String!
    displayOrder: Int!
    createdAt: String!
  }

  type Ward {
    id: Int!
    code: String!
    name: String!
    capacity: Int!
    displayOrder: Int!
    createdAt: String!
  }

  type OutpatientRecord {
    id: Int!
    date: String!
    department: Department!
    newPatientsCount: Int!
    returningPatientsCount: Int!
    totalCount: Int!
    createdAt: String!
  }

  type InpatientRecord {
    id: Int!
    date: String!
    ward: Ward!
    department: Department!
    currentPatientCount: Int!
    newAdmissionCount: Int!
    dischargeCount: Int!
    transferOutCount: Int!
    transferInCount: Int!
    createdAt: String!
  }

  type OutpatientSummary {
    date: String!
    totalNew: Int!
    totalReturning: Int!
    totalPatients: Int!
  }

  type InpatientSummary {
    date: String!
    totalCurrent: Int!
    totalNewAdmission: Int!
    totalDischarge: Int!
    totalTransferOut: Int!
    totalTransferIn: Int!
  }

  type OutpatientByDepartment {
    department: Department!
    records: [OutpatientRecord!]!
    totalNew: Int!
    totalReturning: Int!
    totalPatients: Int!
  }

  type InpatientByWard {
    ward: Ward!
    records: [InpatientRecord!]!
    totalCurrent: Int!
    totalNewAdmission: Int!
    totalDischarge: Int!
  }

  type Permission {
    jobTypeCode: String!
    jobTypeName: String!
    level: Int!
  }

  type Staff {
    id: String!
    name: String!
    jobTypeCode: String!
    permission: Permission!
    createdAt: String!
  }

  type Doctor {
    code: String!
    name: String!
    departmentCode: String!
    department: Department!
    createdAt: String!
  }

  type Sales {
    doctorCode: String!
    yearMonth: String!
    outpatientSales: Float!
    inpatientSales: Float!
    totalSales: Float!
    updatedAt: String!
  }

  type SalesSummary {
    yearMonth: String!
    totalOutpatientSales: Float!
    totalInpatientSales: Float!
    totalSales: Float!
  }

  type Query {
    # マスタデータ
    departments: [Department!]!
    wards: [Ward!]!
    
    # 外来患者データ
    outpatientRecords(startDate: String, endDate: String, departmentId: Int): [OutpatientRecord!]!
    outpatientSummary(startDate: String, endDate: String): [OutpatientSummary!]!
    outpatientByDepartment(startDate: String, endDate: String): [OutpatientByDepartment!]!
    
    # 入院患者データ
    inpatientRecords(startDate: String, endDate: String, wardId: Int, departmentId: Int): [InpatientRecord!]!
    inpatientSummary(startDate: String, endDate: String): [InpatientSummary!]!
    inpatientByWard(startDate: String, endDate: String): [InpatientByWard!]!
    
    # 認証
    verifyStaff(staffId: String!): Staff
    
    # 売上データ
    doctors: [Doctor!]!
    doctorsByDepartment(departmentCode: String!): [Doctor!]!
    salesSummary(startMonth: String, endMonth: String): [SalesSummary!]!
    salesByDoctor(doctorCode: String!, startMonth: String, endMonth: String): [Sales!]!
    salesByDepartment(departmentCode: String!, startMonth: String, endMonth: String): [SalesSummary!]!
  }
`

// リゾルバ実装
const resolvers = {
  Query: {
    // 診療科一覧取得
    departments: async () => {
      const result = await pool.query('SELECT * FROM departments ORDER BY display_order, code')
      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        displayOrder: row.display_order,
        createdAt: row.created_at.toISOString(),
      }))
    },

    // 病棟一覧取得
    wards: async () => {
      const result = await pool.query('SELECT * FROM wards ORDER BY display_order, code')
      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        capacity: row.capacity,
        displayOrder: row.display_order,
        createdAt: row.created_at.toISOString(),
      }))
    },

    // 外来患者記録取得
    outpatientRecords: async (_, { startDate, endDate, departmentId }) => {
      let query = `
        SELECT o.*, d.id as dept_id, d.code as dept_code, d.name as dept_name, d.created_at as dept_created_at
        FROM outpatient_records o
        JOIN departments d ON o.department_id = d.id
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startDate) {
        query += ` AND o.date >= $${paramCount++}`
        params.push(startDate)
      }
      if (endDate) {
        query += ` AND o.date <= $${paramCount++}`
        params.push(endDate)
      }
      if (departmentId) {
        query += ` AND o.department_id = $${paramCount++}`
        params.push(departmentId)
      }

      query += ' ORDER BY o.date DESC, d.display_order, d.code'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        department: {
          id: row.dept_id,
          code: row.dept_code,
          name: row.dept_name,
          createdAt: row.dept_created_at.toISOString(),
        },
        newPatientsCount: row.new_patients_count,
        returningPatientsCount: row.returning_patients_count,
        totalCount: row.new_patients_count + row.returning_patients_count,
        createdAt: row.created_at.toISOString(),
      }))
    },

    // 外来患者サマリー
    outpatientSummary: async (_, { startDate, endDate }) => {
      let query = `
        SELECT 
          date,
          SUM(new_patients_count) as total_new,
          SUM(returning_patients_count) as total_returning,
          SUM(new_patients_count + returning_patients_count) as total_patients
        FROM outpatient_records
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startDate) {
        query += ` AND date >= $${paramCount++}`
        params.push(startDate)
      }
      if (endDate) {
        query += ` AND date <= $${paramCount++}`
        params.push(endDate)
      }

      query += ' GROUP BY date ORDER BY date DESC'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        totalNew: parseInt(row.total_new),
        totalReturning: parseInt(row.total_returning),
        totalPatients: parseInt(row.total_patients),
      }))
    },

    // 診療科別外来患者集計
    outpatientByDepartment: async (_, { startDate, endDate }) => {
      let query = `
        SELECT 
          d.id, d.code, d.name, d.created_at,
          SUM(o.new_patients_count) as total_new,
          SUM(o.returning_patients_count) as total_returning
        FROM departments d
        LEFT JOIN outpatient_records o ON d.id = o.department_id
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startDate) {
        query += ` AND o.date >= $${paramCount++}`
        params.push(startDate)
      }
      if (endDate) {
        query += ` AND o.date <= $${paramCount++}`
        params.push(endDate)
      }

      query += ' GROUP BY d.id, d.code, d.name, d.display_order, d.created_at ORDER BY d.display_order, d.code'

      const result = await pool.query(query, params)
      
      const departments = await Promise.all(
        result.rows.map(async (row) => {
          // 各診療科の詳細レコード取得
          let recordQuery = `
            SELECT o.*, d.id as dept_id, d.code as dept_code, d.name as dept_name, d.created_at as dept_created_at
            FROM outpatient_records o
            JOIN departments d ON o.department_id = d.id
            WHERE d.id = $1
          `
          const recordParams = [row.id]
          let recordParamCount = 2

          if (startDate) {
            recordQuery += ` AND o.date >= $${recordParamCount++}`
            recordParams.push(startDate)
          }
          if (endDate) {
            recordQuery += ` AND o.date <= $${recordParamCount++}`
            recordParams.push(endDate)
          }

          recordQuery += ' ORDER BY o.date DESC'

          const recordResult = await pool.query(recordQuery, recordParams)

          return {
            department: {
              id: row.id,
              code: row.code,
              name: row.name,
              createdAt: row.created_at.toISOString(),
            },
            records: recordResult.rows.map(r => ({
              id: r.id,
              date: r.date.toISOString().split('T')[0],
              department: {
                id: r.dept_id,
                code: r.dept_code,
                name: r.dept_name,
                createdAt: r.dept_created_at.toISOString(),
              },
              newPatientsCount: r.new_patients_count,
              returningPatientsCount: r.returning_patients_count,
              totalCount: r.new_patients_count + r.returning_patients_count,
              createdAt: r.created_at.toISOString(),
            })),
            totalNew: parseInt(row.total_new) || 0,
            totalReturning: parseInt(row.total_returning) || 0,
            totalPatients: (parseInt(row.total_new) || 0) + (parseInt(row.total_returning) || 0),
          }
        })
      )

      return departments
    },

    // 入院患者記録取得
    inpatientRecords: async (_, { startDate, endDate, wardId, departmentId }) => {
      let query = `
        SELECT 
          i.*,
          w.id as ward_id, w.code as ward_code, w.name as ward_name, w.capacity as ward_capacity, w.created_at as ward_created_at,
          d.id as dept_id, d.code as dept_code, d.name as dept_name, d.created_at as dept_created_at
        FROM inpatient_records i
        JOIN wards w ON i.ward_id = w.id
        JOIN departments d ON i.department_id = d.id
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startDate) {
        query += ` AND i.date >= $${paramCount++}`
        params.push(startDate)
      }
      if (endDate) {
        query += ` AND i.date <= $${paramCount++}`
        params.push(endDate)
      }
      if (wardId) {
        query += ` AND i.ward_id = $${paramCount++}`
        params.push(wardId)
      }
      if (departmentId) {
        query += ` AND i.department_id = $${paramCount++}`
        params.push(departmentId)
      }

      query += ' ORDER BY i.date DESC, w.display_order, w.code, d.display_order, d.code'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        ward: {
          id: row.ward_id,
          code: row.ward_code,
          name: row.ward_name,
          capacity: row.ward_capacity,
          createdAt: row.ward_created_at.toISOString(),
        },
        department: {
          id: row.dept_id,
          code: row.dept_code,
          name: row.dept_name,
          createdAt: row.dept_created_at.toISOString(),
        },
        currentPatientCount: row.current_patient_count,
        newAdmissionCount: row.new_admission_count,
        dischargeCount: row.discharge_count,
        transferOutCount: row.transfer_out_count,
        transferInCount: row.transfer_in_count,
        createdAt: row.created_at.toISOString(),
      }))
    },

    // 入院患者サマリー
    inpatientSummary: async (_, { startDate, endDate }) => {
      let query = `
        SELECT 
          date,
          SUM(current_patient_count) as total_current,
          SUM(new_admission_count) as total_new_admission,
          SUM(discharge_count) as total_discharge,
          SUM(transfer_out_count) as total_transfer_out,
          SUM(transfer_in_count) as total_transfer_in
        FROM inpatient_records
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startDate) {
        query += ` AND date >= $${paramCount++}`
        params.push(startDate)
      }
      if (endDate) {
        query += ` AND date <= $${paramCount++}`
        params.push(endDate)
      }

      query += ' GROUP BY date ORDER BY date DESC'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        totalCurrent: parseInt(row.total_current),
        totalNewAdmission: parseInt(row.total_new_admission),
        totalDischarge: parseInt(row.total_discharge),
        totalTransferOut: parseInt(row.total_transfer_out),
        totalTransferIn: parseInt(row.total_transfer_in),
      }))
    },

    // 病棟別入院患者集計
    inpatientByWard: async (_, { startDate, endDate }) => {
      let query = `
        SELECT 
          w.id, w.code, w.name, w.capacity, w.created_at,
          SUM(i.current_patient_count) as total_current,
          SUM(i.new_admission_count) as total_new_admission,
          SUM(i.discharge_count) as total_discharge
        FROM wards w
        LEFT JOIN inpatient_records i ON w.id = i.ward_id
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startDate) {
        query += ` AND i.date >= $${paramCount++}`
        params.push(startDate)
      }
      if (endDate) {
        query += ` AND i.date <= $${paramCount++}`
        params.push(endDate)
      }

      query += ' GROUP BY w.id, w.code, w.name, w.capacity, w.display_order, w.created_at ORDER BY w.display_order, w.code'

      const result = await pool.query(query, params)

      const wards = await Promise.all(
        result.rows.map(async (row) => {
          // 各病棟の詳細レコード取得
          let recordQuery = `
            SELECT 
              i.*,
              w.id as ward_id, w.code as ward_code, w.name as ward_name, w.capacity as ward_capacity, w.created_at as ward_created_at,
              d.id as dept_id, d.code as dept_code, d.name as dept_name, d.created_at as dept_created_at
            FROM inpatient_records i
            JOIN wards w ON i.ward_id = w.id
            JOIN departments d ON i.department_id = d.id
            WHERE w.id = $1
          `
          const recordParams = [row.id]
          let recordParamCount = 2

          if (startDate) {
            recordQuery += ` AND i.date >= $${recordParamCount++}`
            recordParams.push(startDate)
          }
          if (endDate) {
            recordQuery += ` AND i.date <= $${recordParamCount++}`
            recordParams.push(endDate)
          }

          recordQuery += ' ORDER BY i.date DESC, d.display_order, d.code'

          const recordResult = await pool.query(recordQuery, recordParams)

          return {
            ward: {
              id: row.id,
              code: row.code,
              name: row.name,
              capacity: row.capacity,
              createdAt: row.created_at.toISOString(),
            },
            records: recordResult.rows.map(r => ({
              id: r.id,
              date: r.date.toISOString().split('T')[0],
              ward: {
                id: r.ward_id,
                code: r.ward_code,
                name: r.ward_name,
                capacity: r.ward_capacity,
                createdAt: r.ward_created_at.toISOString(),
              },
              department: {
                id: r.dept_id,
                code: r.dept_code,
                name: r.dept_name,
                createdAt: r.dept_created_at.toISOString(),
              },
              currentPatientCount: r.current_patient_count,
              newAdmissionCount: r.new_admission_count,
              dischargeCount: r.discharge_count,
              transferOutCount: r.transfer_out_count,
              transferInCount: r.transfer_in_count,
              createdAt: r.created_at.toISOString(),
            })),
            totalCurrent: parseInt(row.total_current) || 0,
            totalNewAdmission: parseInt(row.total_new_admission) || 0,
            totalDischarge: parseInt(row.total_discharge) || 0,
          }
        })
      )

      return wards
    },

    // 職員認証
    verifyStaff: async (_, { staffId }) => {
      const result = await pool.query(`
        SELECT s.*, p.job_type_name, p.level
        FROM staff s
        JOIN permissions p ON s.job_type_code = p.job_type_code
        WHERE s.id = $1
      `, [staffId])

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      return {
        id: row.id,
        name: row.name,
        jobTypeCode: row.job_type_code,
        permission: {
          jobTypeCode: row.job_type_code,
          jobTypeName: row.job_type_name,
          level: row.level,
        },
        createdAt: row.created_at.toISOString(),
      }
    },

    // 医師一覧取得
    doctors: async () => {
      const result = await pool.query(`
        SELECT d.*, dept.id as dept_id, dept.code as dept_code, dept.name as dept_name, 
               dept.display_order as dept_display_order, dept.created_at as dept_created_at
        FROM doctors d
        JOIN departments dept ON d.department_code = dept.code
        ORDER BY dept.display_order, dept.code, d.name
      `)
      
      return result.rows.map(row => ({
        code: row.code,
        name: row.name,
        departmentCode: row.department_code,
        department: {
          id: row.dept_id,
          code: row.dept_code,
          name: row.dept_name,
          displayOrder: row.dept_display_order,
          createdAt: row.dept_created_at.toISOString(),
        },
        createdAt: row.created_at.toISOString(),
      }))
    },

    // 診療科別医師一覧取得
    doctorsByDepartment: async (_, { departmentCode }) => {
      const result = await pool.query(`
        SELECT d.*, dept.id as dept_id, dept.code as dept_code, dept.name as dept_name,
               dept.display_order as dept_display_order, dept.created_at as dept_created_at
        FROM doctors d
        JOIN departments dept ON d.department_code = dept.code
        WHERE d.department_code = $1
        ORDER BY d.name
      `, [departmentCode])
      
      return result.rows.map(row => ({
        code: row.code,
        name: row.name,
        departmentCode: row.department_code,
        department: {
          id: row.dept_id,
          code: row.dept_code,
          name: row.dept_name,
          displayOrder: row.dept_display_order,
          createdAt: row.dept_created_at.toISOString(),
        },
        createdAt: row.created_at.toISOString(),
      }))
    },

    // 売上サマリー取得
    salesSummary: async (_, { startMonth, endMonth }) => {
      let query = `
        SELECT 
          year_month,
          SUM(outpatient_sales) as total_outpatient,
          SUM(inpatient_sales) as total_inpatient
        FROM sales
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (startMonth) {
        query += ` AND year_month >= $${paramCount++}`
        params.push(startMonth)
      }
      if (endMonth) {
        query += ` AND year_month <= $${paramCount++}`
        params.push(endMonth)
      }

      query += ' GROUP BY year_month ORDER BY year_month'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        yearMonth: row.year_month,
        totalOutpatientSales: parseFloat(row.total_outpatient),
        totalInpatientSales: parseFloat(row.total_inpatient),
        totalSales: parseFloat(row.total_outpatient) + parseFloat(row.total_inpatient),
      }))
    },

    // 医師別売上取得
    salesByDoctor: async (_, { doctorCode, startMonth, endMonth }) => {
      let query = `
        SELECT *
        FROM sales
        WHERE doctor_code = $1
      `
      const params = [doctorCode]
      let paramCount = 2

      if (startMonth) {
        query += ` AND year_month >= $${paramCount++}`
        params.push(startMonth)
      }
      if (endMonth) {
        query += ` AND year_month <= $${paramCount++}`
        params.push(endMonth)
      }

      query += ' ORDER BY year_month'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        doctorCode: row.doctor_code,
        yearMonth: row.year_month,
        outpatientSales: parseFloat(row.outpatient_sales),
        inpatientSales: parseFloat(row.inpatient_sales),
        totalSales: parseFloat(row.outpatient_sales) + parseFloat(row.inpatient_sales),
        updatedAt: row.updated_at.toISOString(),
      }))
    },

    // 診療科別売上取得
    salesByDepartment: async (_, { departmentCode, startMonth, endMonth }) => {
      let query = `
        SELECT 
          s.year_month,
          SUM(s.outpatient_sales) as total_outpatient,
          SUM(s.inpatient_sales) as total_inpatient
        FROM sales s
        JOIN doctors d ON s.doctor_code = d.code
        WHERE d.department_code = $1
      `
      const params = [departmentCode]
      let paramCount = 2

      if (startMonth) {
        query += ` AND s.year_month >= $${paramCount++}`
        params.push(startMonth)
      }
      if (endMonth) {
        query += ` AND s.year_month <= $${paramCount++}`
        params.push(endMonth)
      }

      query += ' GROUP BY s.year_month ORDER BY s.year_month'

      const result = await pool.query(query, params)
      return result.rows.map(row => ({
        yearMonth: row.year_month,
        totalOutpatientSales: parseFloat(row.total_outpatient),
        totalInpatientSales: parseFloat(row.total_inpatient),
        totalSales: parseFloat(row.total_outpatient) + parseFloat(row.total_inpatient),
      }))
    },
  },
}

// Yogaサーバー作成
const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  cors: {
    origin: '*',
    credentials: true,
  },
  graphiql: {
    title: 'Hospital Dashboard GraphQL API',
  },
})

// HTTPサーバー起動
const server = createServer(yoga)
const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`🏥 Hospital GraphQL Server running on http://localhost:${PORT}/graphql`)
})

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  await pool.end()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
