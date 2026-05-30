import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './lib/store'
import NavBar from './components/NavBar'
import LoginMock from './pages/LoginMock'
import ContractList from './pages/ContractList'
import ContractNew from './pages/ContractNew'
import ContractDetail from './pages/ContractDetail'
import CommentEdit from './pages/CommentEdit'

export default function App() {
  const { currentUser } = useStore()

  if (!currentUser) return <LoginMock />

  return (
    <>
      <NavBar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/contracts" replace />} />
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/new" element={<ContractNew />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/contracts/:id/comment" element={<CommentEdit />} />
          <Route path="*" element={<Navigate to="/contracts" replace />} />
        </Routes>
      </div>
    </>
  )
}
