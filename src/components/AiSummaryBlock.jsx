import { useState } from 'react'
import { useStore } from '../lib/store'

export default function AiSummaryBlock({ contract, editable = false }) {
  const { saveAiSummary } = useStore()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(contract.ai_summary || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveAiSummary(contract.id, text, true)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCancel = () => {
    setText(contract.ai_summary || '')
    setEditing(false)
  }

  return (
    <div style={{ border: '1px solid #e0f2fe', borderRadius: 8, background: '#f0f9ff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#e0f2fe', borderBottom: '1px solid #bae6fd' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#0369a1' }}>AI Summary</span>
          {contract.ai_summary_edited && (
            <span style={{ fontSize: 11, color: '#6b7280', background: 'white', borderRadius: 4, padding: '1px 6px' }}>已編輯</span>
          )}
          {saved && (
            <span style={{ fontSize: 11, color: '#16a34a' }}>✓ 已儲存</span>
          )}
        </div>
        {editable && !editing && (
          <button className="btn btn-outline btn-sm" onClick={() => { setText(contract.ai_summary || ''); setEditing(true) }}>
            ✏️ 編輯
          </button>
        )}
      </div>

      <div style={{ padding: 14 }}>
        {!contract.ai_summary && !editing ? (
          <div style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>
            ⚠️ AI Summary 不可用，請手動填寫摘要。
            {editable && (
              <button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={() => setEditing(true)}>手動填寫</button>
            )}
          </div>
        ) : editing ? (
          <>
            <textarea
              className="form-control"
              style={{ minHeight: 120, background: 'white' }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="請輸入合約摘要..."
            />
            <div className="btn-group mt-8">
              <button className="btn btn-primary btn-sm" onClick={handleSave}>儲存</button>
              <button className="btn btn-outline btn-sm" onClick={handleCancel}>取消</button>
            </div>
          </>
        ) : (
          <div style={{ color: '#0c4a6e', fontSize: 14, lineHeight: 1.7 }}>{contract.ai_summary}</div>
        )}
      </div>
    </div>
  )
}
