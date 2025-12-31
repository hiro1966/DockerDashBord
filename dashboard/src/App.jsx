import { useState } from 'react'
import OutpatientDashboard from './components/OutpatientDashboard'
import InpatientDashboard from './components/InpatientDashboard'

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

export default function App() {
  const [activeTab, setActiveTab] = useState('outpatient')
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
    <div className="app">
      <div className="header">
        <h1>🏥 病院管理ダッシュボード</h1>
        <p>外来・入院患者数の可視化と分析</p>
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

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'outpatient' ? 'active' : ''}`}
          onClick={() => setActiveTab('outpatient')}
        >
          外来患者
        </button>
        <button 
          className={`tab-button ${activeTab === 'inpatient' ? 'active' : ''}`}
          onClick={() => setActiveTab('inpatient')}
        >
          入院患者
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'outpatient' && (
          <OutpatientDashboard startDate={startDate} endDate={endDate} />
        )}
        {activeTab === 'inpatient' && (
          <InpatientDashboard startDate={startDate} endDate={endDate} />
        )}
      </div>
    </div>
  )
}
