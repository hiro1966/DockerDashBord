import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ children, requiredLevel = 0 }) {
  const { staff, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading">認証確認中...</div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="not-found-screen">
        <div className="not-found-content">
          <h1>❌ アクセスエラー</h1>
          <p>職員IDが見つかりません</p>
          <p className="error-detail">
            正しい職員IDを含むURLでアクセスしてください<br/>
            例: http://localhost:3000?staffId=admin001
          </p>
        </div>
      </div>
    )
  }

  if (requiredLevel > 0 && staff.permission.level < requiredLevel) {
    return (
      <div className="not-found-screen">
        <div className="not-found-content">
          <h1>🔒 アクセス権限がありません</h1>
          <p>このページを表示する権限がありません</p>
          <p className="error-detail">
            職種: {staff.permission.jobTypeName}<br/>
            権限レベル: {staff.permission.level}<br/>
            必要レベル: {requiredLevel}以上
          </p>
          <button onClick={() => window.history.back()} className="back-button">
            戻る
          </button>
        </div>
      </div>
    )
  }

  return children
}
