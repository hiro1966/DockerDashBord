import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import { GET_OUTPATIENT_SUMMARY, GET_INPATIENT_SUMMARY } from '../queries'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// 過去7日間の日付を取得
const getLast7Days = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 7)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}

export default function HomePage() {
  const { startDate, endDate } = getLast7Days()

  const { loading: loadingOutpatient, error: errorOutpatient, data: dataOutpatient } = useQuery(GET_OUTPATIENT_SUMMARY, {
    variables: { startDate, endDate },
  })

  const { loading: loadingInpatient, error: errorInpatient, data: dataInpatient } = useQuery(GET_INPATIENT_SUMMARY, {
    variables: { startDate, endDate },
  })

  if (loadingOutpatient || loadingInpatient) return <div className="loading">読み込み中...</div>
  if (errorOutpatient || errorInpatient) return <div className="error">エラーが発生しました</div>

  const outpatientData = dataOutpatient?.outpatientSummary || []
  const inpatientData = dataInpatient?.inpatientSummary || []

  // 統計サマリー計算
  const outpatientTotal = outpatientData.reduce((sum, d) => sum + d.totalPatients, 0)
  const inpatientTotal = inpatientData.reduce((sum, d) => sum + d.totalCurrent, 0)

  return (
    <div className="home-page">
      <div className="dashboard-grid">
        {/* 外来患者グラフ */}
        <Link to="/outpatient" className="dashboard-card clickable">
          <div className="card-header">
            <h2>📊 外来患者数</h2>
            <p className="subtitle">過去7日間の推移</p>
          </div>
          <div className="chart-preview">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...outpatientData].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalPatients" stroke="#667eea" name="合計患者数" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <div className="stat-summary">
              <span className="stat-label">7日間合計</span>
              <span className="stat-value">{outpatientTotal.toLocaleString()}人</span>
            </div>
            <div className="card-link">詳細を見る →</div>
          </div>
        </Link>

        {/* 入院患者グラフ */}
        <Link to="/inpatient" className="dashboard-card clickable">
          <div className="card-header">
            <h2>🏥 入院患者数</h2>
            <p className="subtitle">過去7日間の推移</p>
          </div>
          <div className="chart-preview">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...inpatientData].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalCurrent" stroke="#667eea" name="在院患者数" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <div className="stat-summary">
              <span className="stat-label">平均在院患者数</span>
              <span className="stat-value">{Math.round(inpatientTotal / inpatientData.length).toLocaleString()}人</span>
            </div>
            <div className="card-link">詳細を見る →</div>
          </div>
        </Link>
      </div>

      <div className="info-section">
        <h3>📌 ご利用ガイド</h3>
        <ul>
          <li>各グラフをクリックすると、詳細なデータと統計を確認できます</li>
          <li>外来患者ページでは、診療科別の詳細な分析が可能です</li>
          <li>入院患者ページでは、病棟別の在院状況や入退院の動向を把握できます</li>
          <li>期間を指定して、過去のデータを分析することもできます</li>
        </ul>
      </div>
    </div>
  )
}
