import { query } from '../db/pool.js'

/**
 * 職員認証
 * @param {string} staffId - 職員ID
 * @returns {Promise<Object|null>} 職員情報またはnull
 */
export const verifyStaff = async (staffId) => {
  console.log(`[AUTH] 職員ID検証開始: ${staffId}`)
  
  try {
    const result = await query(
      `SELECT s.id, s.name, s.job_type_code, s.created_at,
              p.job_type_name, p.level
       FROM staff s
       JOIN permissions p ON s.job_type_code = p.job_type_code
       WHERE s.id = $1`,
      [staffId]
    )
    
    console.log(`[AUTH] クエリ結果: ${result.rows.length}件`)
    
    if (result.rows.length === 0) {
      console.log(`[AUTH] ❌ 職員が見つかりません: ${staffId}`)
      console.log(`[AUTH] 利用可能な職員IDを確認するには: SELECT id, name FROM staff LIMIT 10`)
      return null
    }
    
    const row = result.rows[0]
    console.log(`[AUTH] ✅ 職員認証成功: ${row.name} (${staffId})`)
    
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
  } catch (error) {
    console.error(`[AUTH] ⚠️ エラー発生:`, error)
    console.error(`[AUTH] 職員ID: ${staffId}`)
    console.error(`[AUTH] エラー詳細: ${error.message}`)
    throw error
  }
}

export default {
  verifyStaff,
}
