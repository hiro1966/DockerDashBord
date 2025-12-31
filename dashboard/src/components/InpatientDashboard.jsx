import { useQuery } from '@apollo/client'
import { GET_INPATIENT_SUMMARY, GET_INPATIENT_BY_WARD } from '../queries'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function InpatientDashboard({ startDate, endDate }) {
  const { loading: loadingSummary, error: errorSummary, data: dataSummary } = useQuery(GET_INPATIENT_SUMMARY, {
    variables: { startDate, endDate },
  })

  const { loading: loadingByWard, error: errorByWard, data: dataByWard } = useQuery(GET_INPATIENT_BY_WARD, {
    variables: { startDate, endDate },
  })

  if (loadingSummary || loadingByWard) return <div className="loading">読み込み中...</div>
  if (errorSummary || errorByWard) return <div className="error">エラー: {errorSummary?.message || errorByWard?.message}</div>

  const summaryData = dataSummary?.inpatientSummary || []
  const wardData = dataByWard?.inpatientByWard || []

  // 統計サマリー計算（最新日のデータ）
  const latestData = summaryData[0] || {}
  const totalCurrent = wardData.reduce((sum, w) => sum + w.totalCurrent, 0)
  const totalNewAdmission = wardData.reduce((sum, w) => sum + w.totalNewAdmission, 0)
  const totalDischarge = wardData.reduce((sum, w) => sum + w.totalDischarge, 0)

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>在院患者数</h4>
          <div className="value">{totalCurrent.toLocaleString()}人</div>
        </div>
        <div className="stat-card secondary">
          <h4>新入院患者数</h4>
          <div className="value">{totalNewAdmission.toLocaleString()}人</div>
        </div>
        <div className="stat-card tertiary">
          <h4>退院患者数</h4>
          <div className="value">{totalDischarge.toLocaleString()}人</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>📊 日別入院患者数推移</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[...summaryData].reverse()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalCurrent" stroke="#667eea" name="在院" strokeWidth={2} />
            <Line type="monotone" dataKey="totalNewAdmission" stroke="#4facfe" name="新入院" strokeWidth={2} />
            <Line type="monotone" dataKey="totalDischarge" stroke="#f5576c" name="退院" strokeWidth={2} />
            <Line type="monotone" dataKey="totalTransferIn" stroke="#90ee90" name="転入" strokeWidth={2} />
            <Line type="monotone" dataKey="totalTransferOut" stroke="#ffa500" name="転出" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>🏨 病棟別患者数</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={wardData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ward.name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalCurrent" fill="#667eea" name="在院" />
            <Bar dataKey="totalNewAdmission" fill="#4facfe" name="新入院" />
            <Bar dataKey="totalDischarge" fill="#f5576c" name="退院" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ward-list">
        {wardData.map((ward) => (
          <div key={ward.ward.id} className="ward-card">
            <h4>{ward.ward.name} ({ward.ward.code})</h4>
            <div className="stat-row">
              <span className="stat-label">病床数</span>
              <span className="stat-value">{ward.ward.capacity}床</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">在院患者</span>
              <span className="stat-value">{ward.totalCurrent}人</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">新入院</span>
              <span className="stat-value">{ward.totalNewAdmission}人</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">退院</span>
              <span className="stat-value">{ward.totalDischarge}人</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">稼働率</span>
              <span className="stat-value">
                {ward.ward.capacity > 0 ? ((ward.totalCurrent / ward.ward.capacity) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
