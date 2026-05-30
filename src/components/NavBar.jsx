import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

export default function NavBar() {
  const { currentUser, isCentralCoordinator, logout, resetData } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleReset = () => {
    if (window.confirm('重置所有資料回初始狀態？（所有異動將遺失）')) {
      resetData()
    }
  }

  return (
    <nav className="navbar">
      <div className="flex-center gap-12">
        <Link to="/contracts" className="navbar-brand">
          📋 合約審閱系統 <span>HQ</span>
        </Link>
      </div>
      <div className="navbar-right">
        <button className="btn btn-outline btn-sm" onClick={handleReset} title="重置 demo 資料">
          🔄 重置資料
        </button>
        <div className="navbar-user-info">
          <div className="navbar-user-name">{currentUser.name}</div>
          <div className="navbar-user-role">{currentUser.role_desc}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>登出</button>
      </div>
    </nav>
  )
}
