import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_DEPARTMENTS, GET_DOCTORS_BY_DEPARTMENT, GET_SALES_SUMMARY, GET_SALES_BY_DOCTOR, GET_SALES_BY_DEPARTMENT, GET_SALES_BY_DOCTORS_IN_DEPARTMENT } from '../queries'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

// 前年同月の範囲を取得
const getPreviousYearRange = () => {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setMonth(startDate.getMonth() - 24) // 2年前
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() - 12) // 1年前
  return {
    start: startDate.toISOString().slice(0, 7),
    end: endDate.toISOString().slice(0, 7)
  }
}

// 前年同月のラベルを現年に合わせる
const alignPreviousYearData = (currentData, previousData) => {
  if (!currentData || !previousData) return []
  
  return currentData.map(current => {
    const currentDate = new Date(current.yearMonth + '-01')
    const prevDate = new Date(currentDate)
    prevDate.setFullYear(prevDate.getFullYear() - 1)
    const prevYearMonth = prevDate.toISOString().slice(0, 7)
    
    const prevItem = previousData.find(p => p.yearMonth === prevYearMonth)
    return {
      ...current,
      prevOutpatient: prevItem?.totalOutpatientSales || 0,
      prevInpatient: prevItem?.totalInpatientSales || 0,
      prevTotal: prevItem?.totalSales || 0,
    }
  })
}

// 金額をフォーマット
const formatCurrency = (value) => {
  return `¥${(value / 1000000).toFixed(1)}M`
}

// カラーパレット（医師別積み上げ用）
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c',
  '#d084d0', '#8dd1e1', '#ffb347', '#d0a4de', '#7cb5ff'
]

export default function SalesPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [startMonth] = useState(getLastYearMonth())
  const [endMonth] = useState(getCurrentMonth())
  const [prevYearRange] = useState(getPreviousYearRange())

  // 診療科一覧取得
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS)

  // 選択された診療科の医師一覧取得
  const { data: doctorsData } = useQuery(GET_DOCTORS_BY_DEPARTMENT, {
    variables: { departmentCode: selectedDepartment },
    skip: !selectedDepartment,
  })

  // 全体売上サマリー取得（今年）
  const { loading: loadingTotal, data: totalSalesData } = useQuery(GET_SALES_SUMMARY, {
    variables: { startMonth, endMonth },
  })

  // 全体売上サマリー取得（前年）
  const { data: totalSalesPrevData } = useQuery(GET_SALES_SUMMARY, {
    variables: { startMonth: prevYearRange.start, endMonth: prevYearRange.end },
  })

  // 診療科別売上取得（今年）
  const { data: deptSalesData } = useQuery(GET_SALES_BY_DEPARTMENT, {
    variables: { departmentCode: selectedDepartment, startMonth, endMonth },
    skip: !selectedDepartment,
  })

  // 診療科別売上取得（前年）
  const { data: deptSalesPrevData } = useQuery(GET_SALES_BY_DEPARTMENT, {
    variables: { departmentCode: selectedDepartment, startMonth: prevYearRange.start, endMonth: prevYearRange.end },
    skip: !selectedDepartment,
  })

  // 医師別売上取得（今年）
  const { data: doctorSalesData } = useQuery(GET_SALES_BY_DOCTOR, {
    variables: { doctorCode: selectedDoctor, startMonth, endMonth },
    skip: !selectedDoctor,
  })

  // 医師別売上取得（前年）
  const { data: doctorSalesPrevData } = useQuery(GET_SALES_BY_DOCTOR, {
    variables: { doctorCode: selectedDoctor, startMonth: prevYearRange.start, endMonth: prevYearRange.end },
    skip: !selectedDoctor,
  })

  // 診療科内医師別売上取得（積み上げグラフ用）
  const { data: doctorsInDeptSalesData } = useQuery(GET_SALES_BY_DOCTORS_IN_DEPARTMENT, {
    variables: { departmentCode: selectedDepartment, startMonth, endMonth },
    skip: !selectedDepartment || selectedDoctor !== '',
  })

  const departments = departmentsData?.departments || []
  const doctors = doctorsData?.doctorsByDepartment || []
  const totalSales = totalSalesData?.salesSummary || []
  const totalSalesPrev = totalSalesPrevData?.salesSummary || []
  const deptSales = deptSalesData?.salesByDepartment || []
  const deptSalesPrev = deptSalesPrevData?.salesByDepartment || []
  const doctorSales = doctorSalesData?.salesByDoctor || []
  const doctorSalesPrev = doctorSalesPrevData?.salesByDoctor || []
  const doctorsInDeptSales = doctorsInDeptSalesData?.salesByDoctorsInDepartment || []

  // 前年比較データを作成
  const totalSalesWithPrev = alignPreviousYearData(totalSales, totalSalesPrev)
  const deptSalesWithPrev = alignPreviousYearData(deptSales, deptSalesPrev)
  const doctorSalesWithPrev = alignPreviousYearData(
    doctorSales.map(s => ({
      yearMonth: s.yearMonth,
      totalOutpatientSales: s.outpatientSales,
      totalInpatientSales: s.inpatientSales,
      totalSales: s.totalSales,
    })),
    doctorSalesPrev.map(s => ({
      yearMonth: s.yearMonth,
      totalOutpatientSales: s.outpatientSales,
      totalInpatientSales: s.inpatientSales,
      totalSales: s.totalSales,
    }))
  )

  // 表示するデータを決定
  let displayData = totalSalesWithPrev
  let chartTitle = '全体売上推移'
  
  if (selectedDoctor && doctorSalesWithPrev.length > 0) {
    displayData = doctorSalesWithPrev
    const doctorName = doctors.find(d => d.code === selectedDoctor)?.name || selectedDoctor
    chartTitle = `医師別売上推移: ${doctorName}`
  } else if (selectedDepartment && deptSalesWithPrev.length > 0) {
    displayData = deptSalesWithPrev
    const deptName = departments.find(d => d.code === selectedDepartment)?.name || selectedDepartment
    chartTitle = `診療科別売上推移: ${deptName}`
  }

  // 積み上げグラフ用のデータを整形
  const stackedChartData = []
  if (selectedDepartment && !selectedDoctor && doctorsInDeptSales.length > 0) {
    // すべての月を取得
    const allMonths = [...new Set(
      doctorsInDeptSales.flatMap(ds => ds.sales.map(s => s.yearMonth))
    )].sort()

    allMonths.forEach(month => {
      const dataPoint = { yearMonth: month }
      doctorsInDeptSales.forEach((doctorSale, idx) => {
        const sale = doctorSale.sales.find(s => s.yearMonth === month)
        dataPoint[`doctor_${idx}_total`] = sale?.totalSales || 0
        dataPoint[`doctor_${idx}_name`] = doctorSale.doctor.name
      })
      stackedChartData.push(dataPoint)
    })
  }

  // 統計計算
  const totalAmount = displayData.reduce((sum, d) => sum + d.totalSales, 0)
  const totalOutpatient = displayData.reduce((sum, d) => sum + d.totalOutpatientSales, 0)
  const totalInpatient = displayData.reduce((sum, d) => sum + d.totalInpatientSales, 0)
  
  const prevTotalAmount = displayData.reduce((sum, d) => sum + (d.prevTotal || 0), 0)
  const prevTotalOutpatient = displayData.reduce((sum, d) => sum + (d.prevOutpatient || 0), 0)
  const prevTotalInpatient = displayData.reduce((sum, d) => sum + (d.prevInpatient || 0), 0)

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
        <p>医師別・診療科別の売上データを確認できます（過去12ヶ月 vs 前年同月比較）</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>合計売上（今年）</h4>
          <div className="value">{formatCurrency(totalAmount)}</div>
          {prevTotalAmount > 0 && (
            <div className="comparison">
              前年: {formatCurrency(prevTotalAmount)} 
              ({((totalAmount / prevTotalAmount - 1) * 100).toFixed(1)}%)
            </div>
          )}
        </div>
        <div className="stat-card secondary">
          <h4>外来売上（今年）</h4>
          <div className="value">{formatCurrency(totalOutpatient)}</div>
          {prevTotalOutpatient > 0 && (
            <div className="comparison">
              前年: {formatCurrency(prevTotalOutpatient)} 
              ({((totalOutpatient / prevTotalOutpatient - 1) * 100).toFixed(1)}%)
            </div>
          )}
        </div>
        <div className="stat-card tertiary">
          <h4>入院売上（今年）</h4>
          <div className="value">{formatCurrency(totalInpatient)}</div>
          {prevTotalInpatient > 0 && (
            <div className="comparison">
              前年: {formatCurrency(prevTotalInpatient)} 
              ({((totalInpatient / prevTotalInpatient - 1) * 100).toFixed(1)}%)
            </div>
          )}
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
        {/* 合計売上グラフ */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>📊 {chartTitle} - 合計</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="yearMonth" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="totalSales" stroke="#8884d8" strokeWidth={2} name="今年 合計" />
              <Line type="monotone" dataKey="prevTotal" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="前年 合計" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 外来売上グラフ */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>🏥 {chartTitle} - 外来</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="yearMonth" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="totalOutpatientSales" stroke="#ff7c7c" strokeWidth={2} name="今年 外来" />
              <Line type="monotone" dataKey="prevOutpatient" stroke="#ffb347" strokeWidth={2} strokeDasharray="5 5" name="前年 外来" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 入院売上グラフ */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>🛏️ {chartTitle} - 入院</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="yearMonth" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="totalInpatientSales" stroke="#82ca9d" strokeWidth={2} name="今年 入院" />
              <Line type="monotone" dataKey="prevInpatient" stroke="#a4de6c" strokeWidth={2} strokeDasharray="5 5" name="前年 入院" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 医師別積み上げグラフ（診療科選択時のみ） */}
        {selectedDepartment && !selectedDoctor && stackedChartData.length > 0 && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>👨‍⚕️ 医師別売上内訳（積み上げ）</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={stackedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="yearMonth" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                {doctorsInDeptSales.map((doctorSale, idx) => (
                  <Area
                    key={doctorSale.doctor.code}
                    type="monotone"
                    dataKey={`doctor_${idx}_total`}
                    stackId="1"
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    name={doctorSale.doctor.name}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 月別売上詳細テーブル */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>📋 月別売上詳細</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>年月</th>
                  <th>外来（今年）</th>
                  <th>外来（前年）</th>
                  <th>入院（今年）</th>
                  <th>入院（前年）</th>
                  <th>合計（今年）</th>
                  <th>合計（前年）</th>
                  <th>前年比</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map(row => {
                  const growth = row.prevTotal > 0 
                    ? ((row.totalSales / row.prevTotal - 1) * 100).toFixed(1) 
                    : '-'
                  return (
                    <tr key={row.yearMonth}>
                      <td>{row.yearMonth}</td>
                      <td>{formatCurrency(row.totalOutpatientSales)}</td>
                      <td>{formatCurrency(row.prevOutpatient || 0)}</td>
                      <td>{formatCurrency(row.totalInpatientSales)}</td>
                      <td>{formatCurrency(row.prevInpatient || 0)}</td>
                      <td><strong>{formatCurrency(row.totalSales)}</strong></td>
                      <td>{formatCurrency(row.prevTotal || 0)}</td>
                      <td className={parseFloat(growth) >= 0 ? 'positive' : 'negative'}>
                        {growth !== '-' ? `${growth}%` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
