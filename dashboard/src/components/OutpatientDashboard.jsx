import { useQuery } from '@apollo/client'
import { GET_OUTPATIENT_SUMMARY, GET_OUTPATIENT_BY_DEPARTMENT } from '../queries'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function OutpatientDashboard({ startDate, endDate }) {
  const { loading: loadingSummary, error: errorSummary, data: dataSummary } = useQuery(GET_OUTPATIENT_SUMMARY, {
    variables: { startDate, endDate },
  })

  const { loading: loadingByDept, error: errorByDept, data: dataByDept } = useQuery(GET_OUTPATIENT_BY_DEPARTMENT, {
    variables: { startDate, endDate },
  })

  if (loadingSummary || loadingByDept) return <div className="loading">読み込み中...</div>
  if (errorSummary || errorByDept) return <div className="error">エラー: {errorSummary?.message || errorByDept?.message}</div>

  const summaryData = dataSummary?.outpatientSummary || []
  const departmentData = dataByDept?.outpatientByDepartment || []

  // 統計サマリー計算
  const totalNew = departmentData.reduce((sum, d) => sum + d.totalNew, 0)
  const totalReturning = departmentData.reduce((sum, d) => sum + d.totalReturning, 0)
  const totalPatients = totalNew + totalReturning

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>合計患者数</h4>
          <div className="value">{totalPatients.toLocaleString()}人</div>
        </div>
        <div className="stat-card secondary">
          <h4>初診患者数</h4>
          <div className="value">{totalNew.toLocaleString()}人</div>
        </div>
        <div className="stat-card tertiary">
          <h4>再診患者数</h4>
          <div className="value">{totalReturning.toLocaleString()}人</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>📈 日別外来患者数推移</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[...summaryData].reverse()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalNew" stroke="#f5576c" name="初診" strokeWidth={2} />
            <Line type="monotone" dataKey="totalReturning" stroke="#4facfe" name="再診" strokeWidth={2} />
            <Line type="monotone" dataKey="totalPatients" stroke="#667eea" name="合計" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>🏥 診療科別患者数</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={departmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department.name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalNew" fill="#f5576c" name="初診" />
            <Bar dataKey="totalReturning" fill="#4facfe" name="再診" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="department-list">
        {departmentData.map((dept) => (
          <div key={dept.department.id} className="department-card">
            <h4>{dept.department.name} ({dept.department.code})</h4>
            <div className="stat-row">
              <span className="stat-label">初診</span>
              <span className="stat-value">{dept.totalNew}人</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">再診</span>
              <span className="stat-value">{dept.totalReturning}人</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">合計</span>
              <span className="stat-value">{dept.totalPatients}人</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
