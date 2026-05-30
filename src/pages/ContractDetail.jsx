import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import StatusBadge from '../components/StatusBadge'
import AiSummaryBlock from '../components/AiSummaryBlock'

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
    getContractProgress, canSeeContract, canEditComment,
    inviteParticipant, removeParticipant,
    submitToManager, approveContract, returnContract,
    resubmitAfterReturn, escalateToExec, archiveContract, USERS,
  } = useStore()

  const contract = contracts.find(c => c.id === parseInt(id))

  if (!contract) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div><div className="empty-text">找不到此合約</div>
      <button className="btn btn-outline mt-16" onClick={() => navigate('/contracts')}>← 返回</button>
    </div>
  )
  if (!canSeeContract(contract, currentUser.email)) return (
    <div className="empty-state">
      <div className="empty-icon">🔒</div><div className="empty-text">您沒有權限查看此合約</div>
      <button className="btn btn-outline mt-16" onClick={() => navigate('/contracts')}>← 返回</button>
    </div>
  )

  const cat = getCategoryById(contract.category_id)
  const { total, submitted, allDone } = getContractProgress(contract.id)
  const commentEditable = canEditComment(contract)

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

  const canInvite = isCoordinator && !['mgr_pending', 'exec_pending', 'approved', 'archived'].includes(contract.status)

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
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card">
        <div className="info-grid">
          <div>
            <div className="info-label">廠商名稱</div>
            <div className="info-value">{contract.vendor_name || '—'}</div>
          </div>
          <div>
            <div className="info-label">合約日期</div>
            <div className="info-value">{contract.contract_date || '—'}</div>
          </div>
          <div>
            <div className="info-label">開案者（Case Coordinator）</div>
            <div className="info-value">{getUserByEmail(contract.opened_by)?.name} ({contract.opened_by})</div>
          </div>
          {contract.manager_email && (
            <div>
              <div className="info-label">指派主管</div>
              <div className="info-value">{getUserByEmail(contract.manager_email)?.name} ({contract.manager_email})</div>
            </div>
          )}
          {contract.exec_email && (
            <div>
              <div className="info-label">最高主管（Top Manager）</div>
              <div className="info-value">{getUserByEmail(contract.exec_email)?.name} ({contract.exec_email})</div>
            </div>
          )}
          {contract.approval_layers && (
            <div>
              <div className="info-label">簽核層數</div>
              <div className="info-value">{contract.approval_layers} 層</div>
            </div>
          )}
          {contract.file_path && (
            <div>
              <div className="info-label">合約檔案</div>
              <div className="info-value">📎 {contract.file_path}</div>
            </div>
          )}
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
        </div>
      </div>

      {/* AI Summary */}
      {(contract.ai_summary || isCoordinator) && (
        <div className="card">
          <div className="section-title mb-16">合約摘要</div>
          <AiSummaryBlock contract={contract} editable={isCoordinator && commentEditable} />
        </div>
      )}

      {/* Participants + Progress */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">參與者</div>
            {total > 0 && (
              <div className="flex-center gap-8 mt-8" style={{ maxWidth: 320 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(submitted / total) * 100}%` }} />
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
            const submittedOnce = pComment?.submitted_at !== null
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
                  <span className={`badge ${submittedOnce ? 'badge-submitted' : 'badge-draft'}`}>
                    {submittedOnce ? '已提交' : '草稿'}
                  </span>
                  {canInvite && (
                    <button className="btn btn-outline btn-sm"
                      onClick={() => { if (window.confirm(`確定移除 ${user?.name}？`)) removeParticipant(contract.id, p.id) }}>
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
        <div className="section-header">
          <div className="section-title">意見書</div>
          {!commentEditable && (
            <span className="text-sm text-muted">🔒 審核中，意見已鎖定</span>
          )}
        </div>

        {activeParticipants.length === 0 ? (
          <p className="text-muted text-sm">尚無參與者</p>
        ) : (
          activeParticipants.map(p => {
            const pComment = comments.find(c => c.contract_id === contract.id && c.participant_id === p.id && c.is_active)
            const user = getUserByEmail(p.email)
            const isMyComment = p.email === currentUser.email
            const submittedOnce = pComment?.submitted_at !== null
            // Can edit: it's my comment AND contract allows editing
            const canEdit = isMyComment && commentEditable
            return (
              <div key={p.id} className="comment-card">
                <div className="comment-header">
                  <div>
                    <span className="comment-author">{user?.name}</span>
                    <span className="role-tag" style={{ marginLeft: 8 }}>{p.role_label}</span>
                    {submittedOnce && pComment?.status === 'draft' && commentEditable && (
                      <span className="text-xs text-muted" style={{ marginLeft: 8 }}>(已提交，編輯中)</span>
                    )}
                  </div>
                  <div className="flex-center gap-8">
                    <span className={`badge ${submittedOnce ? 'badge-submitted' : 'badge-draft'}`}>
                      {submittedOnce ? '✓ 已提交' : '草稿'}
                    </span>
                    {canEdit && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/contracts/${contract.id}/comment`)}>
                        {submittedOnce ? '修改意見' : '撰寫 / 提交'}
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

      {/* Actions */}
      <ActionArea
        contract={contract}
        isCC={isCC} isCoordinator={isCoordinator} isManager={isManager} isExec={isExec}
        allDone={allDone} total={total}
        onSubmitToManager={(params) => submitToManager(contract.id, params)}
        onApprove={() => approveContract(contract.id)}
        onReturn={() => { if (window.confirm('確定退回？參與者將可重新修改意見。')) returnContract(contract.id) }}
        onResubmit={(params) => resubmitAfterReturn(contract.id, params)}
        onEscalate={(exec_email) => escalateToExec(contract.id, exec_email)}
        onArchive={() => { if (window.confirm('確定觸發歸檔？')) archiveContract(contract.id) }}
        USERS={USERS}
      />
    </div>
  )
}

// ── Invite Form ──
function InviteForm({ contractId, existing, onInvite, USERS }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('AP')
  const existingEmails = existing.map(p => p.email)
  const available = USERS.filter(u => !existingEmails.includes(u.email))

  return (
    <div className="invite-form">
      <span className="text-sm fw-600" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>Invite：</span>
      <select className="form-control" value={email} onChange={e => setEmail(e.target.value)}>
        <option value="">── 選擇人員 ──</option>
        {available.map(u => <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>)}
      </select>
      <select className="form-control" style={{ maxWidth: 110 }} value={role} onChange={e => setRole(e.target.value)}>
        <option>AP</option><option>FA</option><option>TAMD</option><option>Other</option>
      </select>
      <button className="btn btn-primary btn-sm" onClick={() => { if (email) { onInvite(contractId, email, role); setEmail('') } }}>
        Invite
      </button>
    </div>
  )
}

// ── Submit Modal ──
function SubmitModal({ title, USERS, onConfirm, onClose }) {
  const [managerEmail, setManagerEmail] = useState('peter@company.com')
  const [layers, setLayers] = useState(1)
  const [execEmail, setExecEmail] = useState('mary@company.com')

  const managers = USERS.filter(u => !['mary@company.com'].includes(u.email) &&
    ['peter@company.com', 'abby@company.com'].includes(u.email))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 10, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#1e3a5f' }}>{title}</div>

        <div className="form-group">
          <label className="form-label">指派主管</label>
          <select className="form-control" value={managerEmail} onChange={e => setManagerEmail(e.target.value)}>
            {USERS.filter(u => !['mary@company.com'].includes(u.email)).map(u => (
              <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">簽核層數</label>
          <select className="form-control" value={layers} onChange={e => setLayers(parseInt(e.target.value))}>
            <option value={1}>1 層（主管）</option>
            <option value={2}>2 層（主管 + 最高主管）</option>
          </select>
        </div>
        {layers === 2 && (
          <div className="form-group">
            <label className="form-label">最高主管</label>
            <select className="form-control" value={execEmail} onChange={e => setExecEmail(e.target.value)}>
              {USERS.filter(u => u.email === 'mary@company.com').map(u => (
                <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>
              ))}
            </select>
          </div>
        )}
        <div className="btn-group mt-16">
          <button className="btn btn-primary" onClick={() => onConfirm({ manager_email: managerEmail, approval_layers: layers, exec_email: execEmail })}>
            確認送審
          </button>
          <button className="btn btn-outline" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

// ── Escalate Modal ──
function EscalateModal({ USERS, onConfirm, onClose }) {
  const [execEmail, setExecEmail] = useState('mary@company.com')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 10, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#1e3a5f' }}>送 Top Manager 審核</div>
        <div className="form-group">
          <label className="form-label">指定 Top Manager</label>
          <select className="form-control" value={execEmail} onChange={e => setExecEmail(e.target.value)}>
            {USERS.filter(u => u.email === 'mary@company.com').map(u => (
              <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>
            ))}
          </select>
        </div>
        <div className="alert alert-warning">送出後狀態將回到「待最高主管審核」。</div>
        <div className="btn-group mt-16">
          <button className="btn btn-warning" onClick={() => onConfirm(execEmail)}>確認送出</button>
          <button className="btn btn-outline" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

// ── Action Area ──
function ActionArea({ contract, isCC, isCoordinator, isManager, isExec, allDone, total, onSubmitToManager, onApprove, onReturn, onResubmit, onEscalate, onArchive, USERS }) {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [reminded, setReminded] = useState(false)
  const s = contract.status

  const actions = []

  if (['in_review', 'new'].includes(s) && isCoordinator) {
    actions.push(
      <button key="submit" className="btn btn-primary" disabled={!allDone || total === 0}
        onClick={() => setShowSubmitModal(true)}
        title={!allDone ? '需等全員提交意見' : ''}>
        📤 送主管審核{!allDone && total > 0 ? '（等待全員提交）' : ''}
      </button>
    )
  }

  if (s === 'returned' && isCoordinator) {
    actions.push(
      <button key="resubmit" className="btn btn-warning" disabled={!allDone || total === 0}
        onClick={() => setShowSubmitModal(true)}>
        🔄 重新送審{!allDone && total > 0 ? '（等待全員重新提交）' : ''}
      </button>
    )
  }

  if (s === 'mgr_pending' && isManager) {
    actions.push(
      <button key="approve" className="btn btn-success" onClick={onApprove}>✅ 核准</button>,
      <button key="return" className="btn btn-danger" onClick={onReturn}>↩ 退回</button>
    )
    if (contract.approval_layers === 2) {
      actions.push(<span key="hint" className="text-sm text-muted" style={{ alignSelf: 'center' }}>核准後送最高主管審核</span>)
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
          onClick={() => { setReminded(true); alert('已發送提醒 Email（Mock）') }}>
          🔔 {reminded ? '已發送提醒' : 'Manual Remind'}
        </button>
      )
    }
  }

  if (s === 'approved') {
    if (isCC) {
      actions.push(
        <button key="archive" className="btn btn-primary" onClick={onArchive}>📁 觸發歸檔</button>,
        <button key="escalate" className="btn btn-warning" onClick={() => setShowEscalateModal(true)}>
          ⬆️ 送 Top Manager 審核
        </button>
      )
    }
  }

  if (actions.length === 0) return null

  return (
    <>
      <div className="card">
        <div className="action-area-title">可執行操作</div>
        <div className="btn-group">{actions}</div>
        {['in_review', 'new'].includes(s) && isCoordinator && !allDone && total > 0 && (
          <div className="alert alert-warning mt-16">需等所有參與者至少提交一次意見後，才能送審。</div>
        )}
      </div>

      {showSubmitModal && (
        <SubmitModal
          title={s === 'returned' ? '重新送審' : '送主管審核'}
          USERS={USERS}
          onConfirm={(params) => {
            s === 'returned' ? onResubmit(params) : onSubmitToManager(params)
            setShowSubmitModal(false)
          }}
          onClose={() => setShowSubmitModal(false)}
        />
      )}

      {showEscalateModal && (
        <EscalateModal
          USERS={USERS}
          onConfirm={(exec_email) => { onEscalate(exec_email); setShowEscalateModal(false) }}
          onClose={() => setShowEscalateModal(false)}
        />
      )}
    </>
  )
}
