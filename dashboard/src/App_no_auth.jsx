import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import OutpatientPage from './pages/OutpatientPage'
import InpatientPage from './pages/InpatientPage'

function AppContent() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="app">
      <div className="header">
        <h1>🏥 病院管理ダッシュボード</h1>
        <p>外来・入院患者数の可視化と分析</p>
        {!isHome && (
          <nav className="header-nav">
            <Link to="/" className="nav-link">ホーム</Link>
            <Link to="/outpatient" className="nav-link">外来患者</Link>
            <Link to="/inpatient" className="nav-link">入院患者</Link>
          </nav>
        )}
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/outpatient" element={<OutpatientPage />} />
        <Route path="/inpatient" element={<InpatientPage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
