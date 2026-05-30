import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import StatusBadge from '../components/StatusBadge'

function fmtDate(iso) {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

export default function ContractList() {
  const { currentUser, getVisibleContracts, getTodos, getCategoryById, getContractProgress, participants, isCentralCoordinator } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('todo')
  const [filterStatus, setFilterStatus] = useState('')

  const todos = getTodos(currentUser.email)
  const allContracts = getVisibleContracts(currentUser.email)
  const filtered = filterStatus ? allContracts.filter(c => c.status === filterStatus) : allContracts

  const getActiveParticipants = (contractId) =>
    participants.filter(p => p.contract_id === contractId && p.status === 'active')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">合約清單</div>
        <button className="btn btn-primary" onClick={() => navigate('/contracts/new')}>
          ＋ 新增合約
        </button>
      </div>

      <div className="tabs">
        <div
          className={`tab ${tab === 'todo' ? 'active' : ''}`}
          onClick={() => setTab('todo')}
        >
          待辦事項
          {todos.length > 0 && <span className="tab-badge">{todos.length}</span>}
        </div>
        <div
          className={`tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          全部合約
          <span style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>({allContracts.length})</span>
        </div>
      </div>

      {tab === 'todo' && (
        <div>
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-text">目前沒有待辦事項</div>
            </div>
          ) : (
            todos.map(({ contract, reason, type }) => {
              const cat = getCategoryById(contract.category_id)
              return (
                <div
                  key={`${contract.id}-${type}`}
                  className="todo-item"
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="todo-title">{contract.title}</div>
                    <div className="flex-center gap-8 mt-8">
                      <StatusBadge status={contract.status} />
                      <span className="text-sm text-muted">{cat?.display_name}</span>
                      <span className="text-sm text-muted">・ 建立 {fmtDate(contract.created_at)}</span>
                    </div>
                    <div className="todo-reason mt-8">⚡ {reason}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/contracts/${contract.id}`) }}>
                    前往處理 →
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'all' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="text-sm fw-600 text-muted">篩選狀態：</span>
            <select className="form-control" style={{ width: 200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全部</option>
              <option value="new">新建立</option>
              <option value="in_review">審閱中</option>
              <option value="mgr_pending">待主管審核</option>
              <option value="exec_pending">待最高主管審核</option>
              <option value="approved">已核准</option>
              <option value="archived">已歸檔</option>
              <option value="returned">已退回</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-text">沒有符合的合約</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>合約名稱</th>
                  <th>Category</th>
                  <th>狀態</th>
                  <th>進度 / Approver</th>
                  <th>參與者</th>
                  <th>建立日期</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(contract => {
                  const cat = getCategoryById(contract.category_id)
                  const { total, submitted } = getContractProgress(contract.id)
                  const activeP = getActiveParticipants(contract.id)
                  return (
                    <tr key={contract.id} onClick={() => navigate(`/contracts/${contract.id}`)}>
                      <td>
                        <span className="table-link">{contract.title}</span>
                      </td>
                      <td>{cat?.display_name}</td>
                      <td><StatusBadge status={contract.status} /></td>
                      <td>
                        <ProgressCell contract={contract} total={total} submitted={submitted} />
                      </td>
                      <td>
                        {activeP.length === 0 ? <span className="text-muted">—</span> : (
                          <span className="text-sm">{activeP.map(p => p.email.split('@')[0]).join(', ')}</span>
                        )}
                      </td>
                      <td className="text-sm text-muted">{fmtDate(contract.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function ProgressCell({ contract, total, submitted }) {
  switch (contract.status) {
    case 'in_review':
    case 'returned':
      return total === 0
        ? <span className="text-muted text-sm">尚無參與者</span>
        : <span className="text-sm">⏳ {submitted} / {total} 人已提交</span>
    case 'mgr_pending':
      return <span className="text-sm">主管審核：{contract.manager_email?.split('@')[0]}</span>
    case 'exec_pending':
      return <span className="text-sm">最高主管：{contract.exec_email?.split('@')[0]}</span>
    case 'approved':
    case 'archived':
      return <span className="text-sm" style={{ color: '#16a34a' }}>✓ 核准</span>
    default:
      return <span className="text-muted">—</span>
  }
}
