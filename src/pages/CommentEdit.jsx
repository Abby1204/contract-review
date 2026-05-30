import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

export default function CommentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, contracts, participants, comments, updateComment, submitComment } = useStore()

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

  const isSubmitted = myComment?.status === 'submitted'
  const canEdit = ['in_review', 'returned'].includes(contract.status) && !isSubmitted

  const [text, setText] = useState(myComment?.content || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateComment(myComment.id, text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSubmit = () => {
    if (!text.trim()) { alert('請填寫意見後再提交'); return }
    if (!window.confirm('確定提交意見？提交後無法修改（除非被退回）。')) return
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
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-sm text-muted">身份：{myParticipant.role_label}</div>
          <div className="text-sm fw-600">{currentUser.name}</div>
        </div>
      </div>

      <div className="card">
        {isSubmitted ? (
          <>
            <div className="alert alert-success">✅ 您已提交意見，等待 Coordinator 送審。若被退回，可重新修改。</div>
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {myComment?.content || <span className="comment-empty">（無內容）</span>}
            </div>
          </>
        ) : !canEdit ? (
          <div className="alert alert-warning">目前合約狀態（{contract.status}）下無法編輯意見。</div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">意見內容</label>
              <textarea
                className="form-control"
                style={{ minHeight: 200 }}
                placeholder="請填寫您的審閱意見、建議或注意事項..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="form-hint">提交後此意見將納入合約審閱報告，主管可見。</div>
            </div>

            <div className="alert alert-info">
              ⚡ 提交後若主管退回，所有人可重新修改。
            </div>

            <div className="btn-group">
              <button className="btn btn-outline" onClick={handleSave}>
                {saved ? '✓ 已儲存' : '💾 儲存草稿'}
              </button>
              <button className="btn btn-success btn-lg" onClick={handleSubmit}>
                ✅ 提交意見
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
