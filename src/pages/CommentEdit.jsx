import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

export default function CommentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, contracts, participants, comments, updateComment, submitComment, canEditComment } = useStore()

  const contract = contracts.find(c => c.id === parseInt(id))
  if (!contract) return <div className="empty-state"><div className="empty-text">找不到合約</div></div>

  const myParticipant = participants.find(
    p => p.contract_id === contract.id && p.email === currentUser.email && p.status === 'active'
  )
  if (!myParticipant) return (
    <div className="empty-state">
      <div className="empty-icon">🔒</div>
      <div className="empty-text">您不是此合約的參與者</div>
      <button className="btn btn-outline mt-16" onClick={() => navigate(`/contracts/${id}`)}>← 返回</button>
    </div>
  )

  const myComment = comments.find(
    c => c.contract_id === contract.id && c.participant_id === myParticipant.id && c.is_active
  )

  const editable = canEditComment(contract)
  const submittedOnce = myComment?.submitted_at !== null
  const [text, setText] = useState(myComment?.content || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateComment(myComment.id, text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSubmit = () => {
    if (!text.trim()) { alert('請填寫意見後再提交'); return }
    if (!submittedOnce && !window.confirm('確定提交意見？')) return
    updateComment(myComment.id, text)
    submitComment(myComment.id)
    navigate(`/contracts/${id}`)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm mb-16" onClick={() => navigate(`/contracts/${id}`)}>← 返回合約</button>
          <div className="page-title">撰寫意見書</div>
          <div className="text-muted text-sm mt-8">{contract.title}</div>
          {contract.vendor_name && <div className="text-muted text-sm">廠商：{contract.vendor_name}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-sm text-muted">身份：{myParticipant.role_label}</div>
          <div className="text-sm fw-600">{currentUser.name}</div>
        </div>
      </div>

      <div className="card">
        {!editable ? (
          <div className="alert alert-warning">🔒 合約目前處於審核階段，意見已鎖定，無法修改。</div>
        ) : (
          <>
            {submittedOnce && (
              <div className="alert alert-info">
                ✅ 您已提交過意見。依照 v1.4 規則，在主管審核前可隨時修改，<strong>不需重新提交</strong>（進度計數不受影響）。
              </div>
            )}

            <div className="form-group">
              <label className="form-label">意見內容</label>
              <textarea
                className="form-control"
                style={{ minHeight: 200 }}
                placeholder="請填寫您的審閱意見、建議或注意事項..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="form-hint">
                {submittedOnce
                  ? '修改後點「儲存」即可，無需重新提交（主管看到的是最新版本）。'
                  : '提交後若主管退回，仍可重新修改。'
                }
              </div>
            </div>

            <div className="btn-group">
              <button className="btn btn-outline" onClick={handleSave}>
                {saved ? '✓ 已儲存' : '💾 儲存'}
              </button>
              {!submittedOnce && (
                <button className="btn btn-success btn-lg" onClick={handleSubmit}>
                  ✅ 提交意見
                </button>
              )}
              {submittedOnce && (
                <button className="btn btn-primary btn-lg" onClick={handleSave}>
                  💾 儲存修改
                </button>
              )}
            </div>
          </>
        )}

        {!editable && myComment?.content && (
          <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {myComment.content}
          </div>
        )}
      </div>
    </div>
  )
}
