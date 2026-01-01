import { query } from '../db/pool.js'

/**
 * 医師一覧を取得
 * @returns {Promise<Array>} 医師リスト
 */
export const getDoctors = async () => {
  const result = await query(`
    SELECT d.code, d.name, d.department_code, d.display_order, d.created_at,
           dept.id as dept_id, dept.code as dept_code, dept.name as dept_name,
           dept.display_order as dept_display_order, dept.created_at as dept_created_at
    FROM doctors d
    JOIN departments dept ON d.department_code = dept.code
    ORDER BY dept.display_order, dept.code, d.display_order, d.name
  `)
  
  return result.rows.map(row => ({
    code: row.code,
    name: row.name,
    departmentCode: row.department_code,
    displayOrder: row.display_order,
    department: {
      id: row.dept_id,
      code: row.dept_code,
      name: row.dept_name,
      displayOrder: row.dept_display_order,
      createdAt: new Date(row.dept_created_at).toISOString(),
    },
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

/**
 * 診療科別の医師一覧を取得
 * @param {string} departmentCode - 診療科コード
 * @returns {Promise<Array>} 医師リスト
 */
export const getDoctorsByDepartment = async (departmentCode) => {
  const result = await query(
    `SELECT code, name, department_code, display_order, created_at
     FROM doctors
     WHERE department_code = $1
     ORDER BY display_order, name`,
    [departmentCode]
  )
  
  return result.rows.map(row => ({
    code: row.code,
    name: row.name,
    departmentCode: row.department_code,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

/**
 * 売上サマリーを取得
 * @param {string} startMonth - 開始月 (YYYY-MM)
 * @param {string} endMonth - 終了月 (YYYY-MM)
 * @returns {Promise<Array>} 売上サマリーリスト
 */
export const getSalesSummary = async (startMonth, endMonth) => {
  let queryText = `
    SELECT year_month,
           SUM(outpatient_sales) as total_outpatient,
           SUM(inpatient_sales) as total_inpatient
    FROM sales
  `
  const params = []
  let paramCount = 1
  
  if (startMonth || endMonth) {
    queryText += ' WHERE'
    const conditions = []
    
    if (startMonth) {
      conditions.push(` year_month >= $${paramCount++}`)
      params.push(startMonth)
    }
    if (endMonth) {
      conditions.push(` year_month <= $${paramCount++}`)
      params.push(endMonth)
    }
    
    queryText += conditions.join(' AND')
  }
  
  queryText += ' GROUP BY year_month ORDER BY year_month'
  
  const result = await query(queryText, params)
  
  return result.rows.map(row => ({
    yearMonth: row.year_month,
    totalOutpatientSales: parseFloat(row.total_outpatient),
    totalInpatientSales: parseFloat(row.total_inpatient),
    totalSales: parseFloat(row.total_outpatient) + parseFloat(row.total_inpatient),
  }))
}

/**
 * 医師別売上を取得
 * @param {string} doctorCode - 医師コード
 * @param {string} startMonth - 開始月
 * @param {string} endMonth - 終了月
 * @returns {Promise<Array>} 売上リスト
 */
export const getSalesByDoctor = async (doctorCode, startMonth, endMonth) => {
  let queryText = `
    SELECT doctor_code, year_month, outpatient_sales, inpatient_sales, updated_at
    FROM sales
    WHERE doctor_code = $1
  `
  const params = [doctorCode]
  let paramCount = 2
  
  if (startMonth) {
    queryText += ` AND year_month >= $${paramCount++}`
    params.push(startMonth)
  }
  if (endMonth) {
    queryText += ` AND year_month <= $${paramCount++}`
    params.push(endMonth)
  }
  
  queryText += ' ORDER BY year_month'
  
  const result = await query(queryText, params)
  
  return result.rows.map(row => ({
    doctorCode: row.doctor_code,
    yearMonth: row.year_month,
    outpatientSales: parseFloat(row.outpatient_sales),
    inpatientSales: parseFloat(row.inpatient_sales),
    totalSales: parseFloat(row.outpatient_sales) + parseFloat(row.inpatient_sales),
    updatedAt: new Date(row.updated_at).toISOString(),
  }))
}

export default {
  getDoctors,
  getDoctorsByDepartment,
  getSalesSummary,
  getSalesByDoctor,
}
