import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import StatusBadge from '../components/StatusBadge'

function fmtDate(iso) {
  if (!iso) return '—'
  return iso.slice(0, 16).replace('T', ' ')
}

export default function ContractDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    currentUser, contracts, participants, comments,
    isCentralCoordinator, getCategoryById, getUserByEmail,
    getContractProgress, canSeeContract,
    inviteParticipant, removeParticipant,
    submitToManager, approveContract, returnContract,
    resubmitAfterReturn, archiveContract, USERS,
  } = useStore()

  const contract = contracts.find(c => c.id === parseInt(id))

  if (!contract) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <div className="empty-text">找不到此合約</div>
      <button className="btn btn-outline mt-16" onClick={() => navigate('/contracts')}>← 返回清單</button>
    </div>
  )

  if (!canSeeContract(contract, currentUser.email)) return (
    <div className="empty-state">
      <div className="empty-icon">🔒</div>
      <div className="empty-text">您沒有權限查看此合約</div>
      <button className="btn btn-outline mt-16" onClick={() => navigate('/contracts')}>← 返回清單</button>
    </div>
  )

  const cat = getCategoryById(contract.category_id)
  const { total, submitted, allDone } = getContractProgress(contract.id)

  const isCC = isCentralCoordinator(currentUser.email)
  const isCaseCoord = contract.opened_by === currentUser.email
  const isCoordinator = isCC || isCaseCoord
  const isManager = contract.manager_email === currentUser.email
  const isExec = contract.exec_email === currentUser.email

  const activeParticipants = participants.filter(p => p.contract_id === contract.id && p.status === 'active')
  const myParticipant = activeParticipants.find(p => p.email === currentUser.email)
  const myComment = myParticipant
    ? comments.find(c => c.contract_id === contract.id && c.participant_id === myParticipant.id && c.is_active)
    : null

  const canEdit = ['in_review', 'returned', 'new'].includes(contract.status) && isCoordinator
  const canInvite = canEdit && !['mgr_pending', 'exec_pending', 'approved', 'archived'].includes(contract.status)

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button className="btn btn-outline btn-sm mb-16" onClick={() => navigate('/contracts')}>← 返回清單</button>
          <div className="page-title">{contract.title}</div>
          <div className="flex-center gap-8 mt-8">
            <StatusBadge status={contract.status} />
            <span className="text-sm text-muted">{cat?.display_name}</span>
            {contract.status === 'archived' && (
              <span className="badge badge-archived">✓ 已歸檔</span>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
        <div className="info-grid">
          <div>
            <div className="info-label">開案者（Case Coordinator）</div>
            <div className="info-value">{getUserByEmail(contract.opened_by)?.name} ({contract.opened_by})</div>
          </div>
          <div>
            <div className="info-label">指派主管</div>
            <div className="info-value">{getUserByEmail(contract.manager_email)?.name} ({contract.manager_email})</div>
          </div>
          {contract.exec_email && (
            <div>
              <div className="info-label">最高主管（Top Manager）</div>
              <div className="info-value">{getUserByEmail(contract.exec_email)?.name} ({contract.exec_email})</div>
            </div>
          )}
          <div>
            <div className="info-label">簽核層數</div>
            <div className="info-value">{contract.approval_layers} 層</div>
          </div>
          <div>
            <div className="info-label">合約檔案</div>
            <div className="info-value">📎 {contract.file_path || '—'}</div>
          </div>
          <div>
            <div className="info-label">建立時間</div>
            <div className="info-value">{fmtDate(contract.created_at)}</div>
          </div>
          {contract.submitted_at && (
            <div>
              <div className="info-label">送審時間</div>
              <div className="info-value">{fmtDate(contract.submitted_at)}</div>
            </div>
          )}
          {contract.archived_at && (
            <div>
              <div className="info-label">歸檔時間</div>
              <div className="info-value">{fmtDate(contract.archived_at)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Participants + Progress */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">參與者</div>
            {total > 0 && (
              <div className="flex-center gap-8 mt-8" style={{ maxWidth: 320 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }} />
                </div>
                <span className="progress-text">{submitted} / {total} 人已提交</span>
              </div>
            )}
          </div>
        </div>

        {activeParticipants.length === 0 ? (
          <p className="text-muted text-sm">尚無參與者</p>
        ) : (
          activeParticipants.map(p => {
            const pComment = comments.find(c => c.contract_id === contract.id && c.participant_id === p.id && c.is_active)
            const user = getUserByEmail(p.email)
            return (
              <div key={p.id} className="participant-row">
                <div className="participant-info">
                  <span className="role-tag">{p.role_label}</span>
                  <div>
                    <div className="participant-name">{user?.name || p.email}</div>
                    <div className="participant-email">{p.email}</div>
                  </div>
                </div>
                <div className="flex-center gap-8">
                  <span className={`badge badge-${pComment?.status || 'draft'}`}>
                    {pComment?.status === 'submitted' ? '已提交' : '草稿'}
                  </span>
                  {canInvite && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        if (window.confirm(`確定移除 ${user?.name}？`)) removeParticipant(contract.id, p.id)
                      }}
                    >
                      移除
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}

        {canInvite && (
          <InviteForm contractId={contract.id} existing={activeParticipants} onInvite={inviteParticipant} USERS={USERS} />
        )}
      </div>

      {/* Comments */}
      <div className="card">
        <div className="section-title mb-16">意見書</div>
        {activeParticipants.length === 0 ? (
          <p className="text-muted text-sm">尚無參與者，Invite 後即可撰寫意見</p>
        ) : (
          activeParticipants.map(p => {
            const pComment = comments.find(c => c.contract_id === contract.id && c.participant_id === p.id && c.is_active)
            const user = getUserByEmail(p.email)
            const isMyComment = p.email === currentUser.email
            const canEditComment = isMyComment && ['in_review', 'returned'].includes(contract.status)
            return (
              <div key={p.id} className="comment-card">
                <div className="comment-header">
                  <div>
                    <span className="comment-author">{user?.name}</span>
                    <span className="role-tag" style={{ marginLeft: 8 }}>{p.role_label}</span>
                  </div>
                  <div className="flex-center gap-8">
                    <span className={`badge badge-${pComment?.status || 'draft'}`}>
                      {pComment?.status === 'submitted' ? '已提交' : '草稿'}
                    </span>
                    {canEditComment && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/contracts/${contract.id}/comment`)}
                      >
                        {pComment?.status === 'submitted' ? '查看' : '撰寫 / 提交'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="comment-body">
                  {pComment?.content
                    ? <div className="comment-text">{pComment.content}</div>
                    : <div className="comment-empty">尚未填寫</div>
                  }
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Action Area */}
      <ActionArea
        contract={contract}
        isCC={isCC}
        isCaseCoord={isCaseCoord}
        isCoordinator={isCoordinator}
        isManager={isManager}
        isExec={isExec}
        allDone={allDone}
        total={total}
        onSubmitToManager={() => submitToManager(contract.id)}
        onApprove={() => approveContract(contract.id)}
        onReturn={() => { if (window.confirm('確定退回？所有參與者將重新撰寫意見。')) returnContract(contract.id) }}
        onResubmit={() => resubmitAfterReturn(contract.id)}
        onArchive={() => { if (window.confirm('確定觸發歸檔？')) archiveContract(contract.id) }}
      />
    </div>
  )
}

function InviteForm({ contractId, existing, onInvite, USERS }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('AP')
  const existingEmails = existing.map(p => p.email)
  const available = USERS.filter(u => !existingEmails.includes(u.email))

  const handleInvite = () => {
    if (!email) { alert('請選擇人員'); return }
    onInvite(contractId, email, role)
    setEmail('')
  }

  return (
    <div className="invite-form">
      <span className="text-sm fw-600" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>Invite 參與者：</span>
      <select className="form-control" value={email} onChange={e => setEmail(e.target.value)}>
        <option value="">── 選擇人員 ──</option>
        {available.map(u => (
          <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>
        ))}
      </select>
      <select className="form-control" style={{ maxWidth: 120 }} value={role} onChange={e => setRole(e.target.value)}>
        <option>AP</option>
        <option>FA</option>
        <option>TAMD</option>
        <option>Other</option>
      </select>
      <button className="btn btn-primary btn-sm" onClick={handleInvite}>Invite</button>
    </div>
  )
}

function ActionArea({ contract, isCC, isCaseCoord, isCoordinator, isManager, isExec, allDone, total, onSubmitToManager, onApprove, onReturn, onResubmit, onArchive }) {
  const [reminded, setReminded] = useState(false)
  const s = contract.status

  const actions = []

  if (s === 'in_review' && isCoordinator) {
    actions.push(
      <button key="submit" className="btn btn-primary" disabled={!allDone || total === 0} onClick={onSubmitToManager} title={!allDone ? '需等全員提交意見' : ''}>
        📤 送主管審核{!allDone && total > 0 ? '（等待全員提交）' : ''}
      </button>
    )
  }

  if (s === 'returned') {
    if (isCoordinator) {
      actions.push(
        <button key="resubmit" className="btn btn-warning" disabled={!allDone || total === 0} onClick={onResubmit}>
          🔄 重新送審{!allDone && total > 0 ? '（等待全員重新提交）' : ''}
        </button>
      )
    }
  }

  if (s === 'mgr_pending' && isManager) {
    actions.push(
      <button key="approve" className="btn btn-success" onClick={onApprove}>✅ 核准</button>,
      <button key="return" className="btn btn-danger" onClick={onReturn}>↩ 退回</button>
    )
    if (contract.approval_layers === 2) {
      actions.push(
        <span key="hint" className="text-sm text-muted" style={{ alignSelf: 'center' }}>核准後將送最高主管審核</span>
      )
    }
  }

  if (s === 'exec_pending') {
    if (isExec) {
      actions.push(
        <button key="approve" className="btn btn-success" onClick={onApprove}>✅ 最終核准</button>,
        <button key="return" className="btn btn-danger" onClick={onReturn}>↩ 退回</button>
      )
    }
    if (isCC) {
      actions.push(
        <button key="remind" className={`btn ${reminded ? 'btn-gray' : 'btn-warning'}`} disabled={reminded}
          onClick={() => { setReminded(true); alert('已發送提醒 Email（Mock：console.log）') }}>
          🔔 {reminded ? '已發送提醒' : 'Manual Remind'}
        </button>
      )
    }
  }

  if (s === 'approved' && isCC) {
    actions.push(
      <button key="archive" className="btn btn-primary" onClick={onArchive}>📁 觸發歸檔</button>
    )
  }

  if (actions.length === 0) return null

  return (
    <div className="card">
      <div className="action-area-title">可執行操作</div>
      <div className="btn-group">{actions}</div>
      {s === 'in_review' && isCoordinator && !allDone && total > 0 && (
        <div className="alert alert-warning mt-16">需等所有參與者提交意見後，才能送審。</div>
      )}
      {s === 'archived' && (
        <div className="alert alert-success mt-16">✅ 此合約已完成歸檔。</div>
      )}
    </div>
  )
}
