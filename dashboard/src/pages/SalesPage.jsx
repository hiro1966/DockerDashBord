import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_DEPARTMENTS, GET_DOCTORS_BY_DEPARTMENT, GET_SALES_SUMMARY, GET_SALES_BY_DOCTOR, GET_SALES_BY_DEPARTMENT } from '../queries'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// 過去12ヶ月の開始月を取得
const getLastYearMonth = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 12)
  return date.toISOString().slice(0, 7)
}

// 今月を取得
const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7)
}

// 金額をフォーマット
const formatCurrency = (value) => {
  return `¥${(value / 1000000).toFixed(1)}M`
}

export default function SalesPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [startMonth] = useState(getLastYearMonth())
  const [endMonth] = useState(getCurrentMonth())

  // 診療科一覧取得
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS)

  // 選択された診療科の医師一覧取得
  const { data: doctorsData } = useQuery(GET_DOCTORS_BY_DEPARTMENT, {
    variables: { departmentCode: selectedDepartment },
    skip: !selectedDepartment,
  })

  // 全体売上サマリー取得
  const { loading: loadingTotal, data: totalSalesData } = useQuery(GET_SALES_SUMMARY, {
    variables: { startMonth, endMonth },
  })

  // 診療科別売上取得
  const { data: deptSalesData } = useQuery(GET_SALES_BY_DEPARTMENT, {
    variables: { departmentCode: selectedDepartment, startMonth, endMonth },
    skip: !selectedDepartment,
  })

  // 医師別売上取得
  const { data: doctorSalesData } = useQuery(GET_SALES_BY_DOCTOR, {
    variables: { doctorCode: selectedDoctor, startMonth, endMonth },
    skip: !selectedDoctor,
  })

  const departments = departmentsData?.departments || []
  const doctors = doctorsData?.doctorsByDepartment || []
  const totalSales = totalSalesData?.salesSummary || []
  const deptSales = deptSalesData?.salesByDepartment || []
  const doctorSales = doctorSalesData?.salesByDoctor || []

  // 表示するデータを決定
  let displayData = totalSales
  let chartTitle = '全体売上推移'
  
  if (selectedDoctor && doctorSales.length > 0) {
    displayData = doctorSales.map(s => ({
      yearMonth: s.yearMonth,
      totalOutpatientSales: s.outpatientSales,
      totalInpatientSales: s.inpatientSales,
      totalSales: s.totalSales,
    }))
    const doctorName = doctors.find(d => d.code === selectedDoctor)?.name || selectedDoctor
    chartTitle = `医師別売上推移: ${doctorName}`
  } else if (selectedDepartment && deptSales.length > 0) {
    displayData = deptSales
    const deptName = departments.find(d => d.code === selectedDepartment)?.name || selectedDepartment
    chartTitle = `診療科別売上推移: ${deptName}`
  }

  // 統計計算
  const totalAmount = displayData.reduce((sum, d) => sum + d.totalSales, 0)
  const totalOutpatient = displayData.reduce((sum, d) => sum + d.totalOutpatientSales, 0)
  const totalInpatient = displayData.reduce((sum, d) => sum + d.totalInpatientSales, 0)

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value)
    setSelectedDoctor('') // 診療科変更時に医師選択をリセット
  }

  if (loadingTotal) return <div className="loading">読み込み中...</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/" className="back-link">← ホームに戻る</Link>
        <h1>💰 売上ダッシュボード</h1>
        <p>医師別・診療科別の売上データを確認できます（過去12ヶ月）</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>合計売上</h4>
          <div className="value">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="stat-card secondary">
          <h4>外来売上</h4>
          <div className="value">{formatCurrency(totalOutpatient)}</div>
        </div>
        <div className="stat-card tertiary">
          <h4>入院売上</h4>
          <div className="value">{formatCurrency(totalInpatient)}</div>
        </div>
      </div>

      <div className="sales-filters">
        <h3>🔍 フィルター</h3>
        <div className="filter-inputs">
          <label>
            診療科
            <select value={selectedDepartment} onChange={handleDepartmentChange}>
              <option value="">全体</option>
              {departments.map(dept => (
                <option key={dept.code} value={dept.code}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </label>

          {selectedDepartment && (
            <label>
              医師
              <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                <option value="">診療科全体</option>
                {doctors.map(doctor => (
                  <option key={doctor.code} value={doctor.code}>
                    {doctor.name} ({doctor.code})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-container">
          <h3>{chartTitle}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="yearMonth" />
              <YAxis tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="totalOutpatientSales" stroke="#4facfe" name="外来売上" strokeWidth={2} />
              <Line type="monotone" dataKey="totalInpatientSales" stroke="#f5576c" name="入院売上" strokeWidth={2} />
              <Line type="monotone" dataKey="totalSales" stroke="#667eea" name="合計売上" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {displayData.length > 0 && (
          <div className="sales-table">
            <h3>📊 月別売上詳細</h3>
            <table>
              <thead>
                <tr>
                  <th>年月</th>
                  <th>外来売上</th>
                  <th>入院売上</th>
                  <th>合計売上</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map(row => (
                  <tr key={row.yearMonth}>
                    <td>{row.yearMonth}</td>
                    <td>{formatCurrency(row.totalOutpatientSales)}</td>
                    <td>{formatCurrency(row.totalInpatientSales)}</td>
                    <td><strong>{formatCurrency(row.totalSales)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
