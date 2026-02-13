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
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'hospital_db',
      user: process.env.DB_USER || 'hospital_user',
      password: process.env.DB_PASSWORD || 'hospital_pass',
    }
    
    console.log(`[DB] 接続プール作成中:`)
    console.log(`[DB]   Host: ${config.host}`)
    console.log(`[DB]   Port: ${config.port}`)
    console.log(`[DB]   Database: ${config.database}`)
    console.log(`[DB]   User: ${config.user}`)
    
    pool = new Pool(config)
    
    pool.on('error', (err) => {
      console.error('[DB] ⚠️ データベースクライアントでエラー発生:', err)
    })
    
    pool.on('connect', () => {
      console.log('[DB] ✅ データベース接続成功')
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
  const startTime = Date.now()
  const pool = getPool()
  
  try {
    console.log(`[DB] クエリ実行:`, text.substring(0, 100) + '...')
    console.log(`[DB] パラメータ:`, params)
    
    const result = await pool.query(text, params)
    const duration = Date.now() - startTime
    
    console.log(`[DB] ✅ クエリ成功: ${result.rows.length}行 (${duration}ms)`)
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[DB] ❌ クエリエラー (${duration}ms):`, error.message)
    console.error(`[DB] SQL:`, text)
    console.error(`[DB] パラメータ:`, params)
    throw error
  }
}

export default {
  getPool,
  closePool,
  resetPool,
  query,
}
