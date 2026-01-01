import { query } from '../db/pool.js'

/**
 * 診療科一覧を取得
 * @returns {Promise<Array>} 診療科リスト
 */
export const getDepartments = async () => {
  const result = await query(
    'SELECT id, code, name, display_order, created_at FROM departments ORDER BY display_order, code'
  )
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

/**
 * 病棟一覧を取得
 * @returns {Promise<Array>} 病棟リスト
 */
export const getWards = async () => {
  const result = await query(
    'SELECT id, code, name, capacity, display_order, created_at FROM wards ORDER BY display_order, code'
  )
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    capacity: row.capacity,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export default {
  getDepartments,
  getWards,
}
