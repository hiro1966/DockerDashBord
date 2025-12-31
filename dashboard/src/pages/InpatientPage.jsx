import { useState } from 'react'
import { Link } from 'react-router-dom'
import InpatientDashboard from '../components/InpatientDashboard'

// 日付をYYYY-MM-DD形式にフォーマット
const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

// 過去30日前の日付を取得
const getThirtyDaysAgo = () => {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return formatDate(date)
}

// 今日の日付を取得
const getToday = () => {
  return formatDate(new Date())
}

export default function InpatientPage() {
  const [startDate, setStartDate] = useState(getThirtyDaysAgo())
  const [endDate, setEndDate] = useState(getToday())

  const handleQuickDateRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setStartDate(formatDate(start))
    setEndDate(formatDate(end))
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/" className="back-link">← ホームに戻る</Link>
        <h1>🏥 入院患者ダッシュボード</h1>
        <p>病棟別の入院患者数と入退院の動向を確認できます</p>
      </div>

      <div className="date-selector">
        <h3>📅 期間選択</h3>
        <div className="date-inputs">
          <label>
            開始日
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            終了日
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button onClick={() => handleQuickDateRange(7)}>過去7日</button>
          <button onClick={() => handleQuickDateRange(30)}>過去30日</button>
          <button onClick={() => handleQuickDateRange(90)}>過去90日</button>
        </div>
      </div>

      <div className="dashboard-content">
        <InpatientDashboard startDate={startDate} endDate={endDate} />
      </div>
    </div>
  )
}
