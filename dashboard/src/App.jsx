import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import OutpatientPage from './pages/OutpatientPage'
import InpatientPage from './pages/InpatientPage'
import SalesPage from './pages/SalesPage'

function AppContent() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { staff, logout, hasPermission } = useAuth()

  return (
    <div className="app">
      <div className="header">
        <div className="header-top">
          <div>
            <h1>🏥 病院管理ダッシュボード</h1>
            <p>外来・入院患者数の可視化と分析</p>
          </div>
          {staff && (
            <div className="user-info">
              <span className="user-name">{staff.name}</span>
              <span className="user-role">({staff.permission.jobTypeName})</span>
              <button onClick={logout} className="logout-button">ログアウト</button>
            </div>
          )}
        </div>
        {!isHome && staff && (
          <nav className="header-nav">
            <Link to="/" className="nav-link">ホーム</Link>
            <Link to="/outpatient" className="nav-link">外来患者</Link>
            <Link to="/inpatient" className="nav-link">入院患者</Link>
            {hasPermission(90) && (
              <Link to="/sales" className="nav-link">売上</Link>
            )}
          </nav>
        )}
      </div>

      <Routes>
        <Route path="/" element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        } />
        <Route path="/outpatient" element={
          <RequireAuth>
            <OutpatientPage />
          </RequireAuth>
        } />
        <Route path="/inpatient" element={
          <RequireAuth>
            <InpatientPage />
          </RequireAuth>
        } />
        <Route path="/sales" element={
          <RequireAuth requiredLevel={90}>
            <SalesPage />
          </RequireAuth>
        } />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}
