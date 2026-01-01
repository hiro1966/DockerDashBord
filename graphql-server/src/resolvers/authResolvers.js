import { query } from '../db/pool.js'

/**
 * 職員認証
 * @param {string} staffId - 職員ID
 * @returns {Promise<Object|null>} 職員情報またはnull
 */
export const verifyStaff = async (staffId) => {
  const result = await query(
    `SELECT s.id, s.name, s.job_type_code, s.created_at,
            p.job_type_name, p.level
     FROM staff s
     JOIN permissions p ON s.job_type_code = p.job_type_code
     WHERE s.id = $1`,
    [staffId]
  )
  
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
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export default {
  verifyStaff,
}
