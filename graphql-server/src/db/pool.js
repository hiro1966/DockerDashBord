import pg from 'pg'

const { Pool } = pg

// データベース接続プール
let pool = null

/**
 * データベース接続プールを取得
 * @returns {Pool} PostgreSQL接続プール
 */
export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'hospital_db',
      user: process.env.DB_USER || 'hospital_user',
      password: process.env.DB_PASSWORD || 'hospital_pass',
    })
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err)
    })
  }
  
  return pool
}

/**
 * データベース接続プールをクローズ
 */
export const closePool = async () => {
  if (pool) {
    await pool.end()
    pool = null
  }
}

/**
 * テスト用: プールをリセット
 */
export const resetPool = () => {
  pool = null
}

/**
 * データベースクエリを実行
 * @param {string} text - SQLクエリ
 * @param {Array} params - クエリパラメータ
 * @returns {Promise} クエリ結果
 */
export const query = async (text, params) => {
  const pool = getPool()
  return pool.query(text, params)
}

export default {
  getPool,
  closePool,
  resetPool,
  query,
}
