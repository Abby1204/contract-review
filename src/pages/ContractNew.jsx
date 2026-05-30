import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

export default function ContractNew() {
  const { createContract, CATEGORIES, USERS, currentUser, TOP_MANAGER_EMAIL } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    category_id: 1,
    manager_email: 'peter@company.com',
    approval_layers: 1,
    exec_email: 'mary@company.com',
    file_path: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const managers = USERS.filter(u => u.email !== currentUser.email && !['mary@company.com'].includes(u.email))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { alert('請填入合約名稱'); return }
    const id = createContract(form)
    navigate(`/contracts/${id}`)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">新增合約</div>
          <div className="text-muted text-sm mt-8">開案後即成為此合約的 Case Coordinator</div>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/contracts')}>← 返回</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">合約名稱 *</label>
            <input
              className="form-control"
              placeholder="請輸入合約名稱"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
              <div className="form-hint">customer 類別為機密合約，閱讀權限較嚴格</div>
            </div>

            <div className="form-group">
              <label className="form-label">合約檔案（模擬）</label>
              <input
                className="form-control"
                placeholder="例：contract_2024.pdf"
                value={form.file_path}
                onChange={e => set('file_path', e.target.value)}
              />
              <div className="form-hint">Mock 環境不實際上傳，僅記錄檔名</div>
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div className="form-group">
              <label className="form-label">指派主管</label>
              <select className="form-control" value={form.manager_email} onChange={e => set('manager_email', e.target.value)}>
                {managers.map(u => (
                  <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">簽核層數</label>
              <select className="form-control" value={form.approval_layers} onChange={e => set('approval_layers', parseInt(e.target.value))}>
                <option value={1}>1 層（主管）</option>
                <option value={2}>2 層（主管 + 最高主管）</option>
              </select>
            </div>
          </div>

          {form.approval_layers === 2 && (
            <div className="form-group">
              <label className="form-label">最高主管（Top Manager）</label>
              <select className="form-control" value={form.exec_email} onChange={e => set('exec_email', e.target.value)}>
                {USERS.filter(u => u.email === 'mary@company.com').map(u => (
                  <option key={u.email} value={u.email}>{u.name} ({u.role_desc})</option>
                ))}
              </select>
              <div className="form-hint">2 層簽核：主管核准後，需再送最高主管審核</div>
            </div>
          )}

          <hr className="divider" />

          <div className="alert alert-info">
            <strong>開案後的流程：</strong><br />
            1. 新增合約後請 Invite 參與者（AP / FA 等）<br />
            2. 各參與者撰寫並提交意見<br />
            3. 全員提交後，Coordinator 可送主管審核
          </div>

          <div className="btn-group">
            <button type="submit" className="btn btn-primary btn-lg">建立合約</button>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/contracts')}>取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}
