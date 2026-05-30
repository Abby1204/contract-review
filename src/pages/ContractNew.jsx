import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import AiSummaryBlock from '../components/AiSummaryBlock'

const MOCK_SUMMARY = (title, vendor) =>
  `本合約為「${title}」，廠商為 ${vendor}。\n（AI Mock 摘要）合約重點：服務期間、付款條件、違約處理等條款已包含。建議審閱廠商資格及保固條款。`

export default function ContractNew() {
  const { createContract, saveAiSummary, inviteParticipant, contracts, CATEGORIES, USERS, currentUser } = useStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [contractId, setContractId] = useState(null)

  // Step 1 form
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    title: '', vendor_name: '', contract_date: today, category_id: 1, file_path: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Step 2 AI Summary
  const [aiLoading, setAiLoading] = useState(false)
  const contract = contracts.find(c => c.id === contractId)

  // Step 3 Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('AP')
  const [invitedList, setInvitedList] = useState([])

  const activeParticipants = contract
    ? contracts.find(c => c.id === contractId) // re-fetch for reactivity — get from store
    : null

  // ── Step 1: Create contract ──
  const handleStep1 = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { alert('請填入合約名稱'); return }
    if (!form.vendor_name.trim()) { alert('請填入廠商名稱'); return }

    const id = createContract({
      title: form.title,
      vendor_name: form.vendor_name,
      contract_date: form.contract_date,
      category_id: form.category_id,
      file_path: form.file_path || null,
      ai_summary: null,
    })
    setContractId(id)

    // Simulate AI summary if file was provided
    if (form.file_path) {
      setAiLoading(true)
      setStep(2)
      setTimeout(() => {
        saveAiSummary(id, MOCK_SUMMARY(form.title, form.vendor_name), false)
        setAiLoading(false)
      }, 1800)
    } else {
      setStep(2)
    }
  }

  // ── Step 3: Invite ──
  const handleInvite = () => {
    if (!inviteEmail) { alert('請選擇人員'); return }
    inviteParticipant(contractId, inviteEmail, inviteRole)
    setInvitedList(l => [...l, { email: inviteEmail, role: inviteRole }])
    setInviteEmail('')
  }

  const alreadyInvited = invitedList.map(i => i.email)
  const available = USERS.filter(u => u.email !== currentUser.email && !alreadyInvited.includes(u.email))

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm mb-16" onClick={() => navigate('/contracts')}>← 返回</button>
          <div className="page-title">新增合約</div>
        </div>
        {/* Step indicator */}
        <div className="flex-center gap-8">
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= n ? '#2563eb' : '#e5e7eb',
                color: step >= n ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
              }}>{n}</div>
              <span style={{ fontSize: 12, color: step === n ? '#2563eb' : '#9ca3af', fontWeight: step === n ? 600 : 400 }}>
                {n === 1 ? '合約資訊' : n === 2 ? 'AI Summary' : 'Invite 參與者'}
              </span>
              {n < 3 && <span style={{ color: '#d1d5db' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="card">
          <div className="card-title">步驟一：填寫合約資訊</div>
          <form onSubmit={handleStep1}>
            <div className="form-group">
              <label className="form-label">合約名稱 *</label>
              <input className="form-control" placeholder="請輸入合約名稱" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <div className="form-group">
                <label className="form-label">廠商名稱 *</label>
                <input className="form-control" placeholder="請輸入廠商名稱" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">合約日期</label>
                <input type="date" className="form-control" value={form.contract_date} onChange={e => set('contract_date', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category_id} onChange={e => set('category_id', parseInt(e.target.value))}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">上傳合約文件（Mock）</label>
                <input className="form-control" placeholder="例：contract_2024.pdf" value={form.file_path} onChange={e => set('file_path', e.target.value)} />
                <div className="form-hint">填入檔名後，下一步會觸發 AI 摘要（Mock）</div>
              </div>
            </div>

            <div className="btn-group mt-16">
              <button type="submit" className="btn btn-primary btn-lg">下一步 →</button>
              <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/contracts')}>取消</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && contract && (
        <div className="card">
          <div className="card-title">步驟二：AI Summary</div>

          {aiLoading ? (
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <span>正在分析合約文件，產生 AI 摘要...</span>
            </div>
          ) : (
            <>
              <AiSummaryBlock contract={contract} editable={true} />
              <div className="alert alert-info mt-16">
                💡 摘要由 AI 自動產生，請確認內容正確後可修改。摘要將隨合約歸檔保存。
              </div>
            </>
          )}

          <div className="btn-group mt-16">
            <button className="btn btn-primary btn-lg" disabled={aiLoading} onClick={() => setStep(3)}>
              下一步 → Invite 參與者
            </button>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← 返回</button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="card">
          <div className="card-title">步驟三：Invite 參與者</div>

          <div className="alert alert-info">
            合約已建立！可以現在 Invite 參與者，或之後在合約詳細頁繼續邀請。
          </div>

          {invitedList.length > 0 && (
            <div className="mb-16">
              <div className="section-title mb-16" style={{ fontSize: 13 }}>已邀請</div>
              {invitedList.map((item, i) => (
                <div key={i} className="participant-row">
                  <div className="participant-info">
                    <span className="role-tag">{item.role}</span>
                    <div>
                      <div className="participant-name">{USERS.find(u => u.email === item.email)?.name}</div>
                      <div className="participant-email">{item.email}</div>
                    </div>
                  </div>
                  <span style={{ color: '#16a34a', fontSize: 13 }}>✓ 已邀請</span>
                </div>
              ))}
            </div>
          )}

          <div className="invite-form">
            <span className="text-sm fw-600" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>新增參與者：</span>
            <select className="form-control" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}>
              <option value="">── 選擇人員 ──</option>
              {available.map(u => <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>)}
            </select>
            <select className="form-control" style={{ maxWidth: 120 }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option>AP</option><option>FA</option><option>TAMD</option><option>Other</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleInvite}>Invite</button>
          </div>

          <div className="btn-group mt-24">
            <button className="btn btn-success btn-lg" onClick={() => navigate(`/contracts/${contractId}`)}>
              前往合約頁面 →
            </button>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← 返回</button>
          </div>
        </div>
      )}
    </div>
  )
}
