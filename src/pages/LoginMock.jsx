import { useState } from 'react'
import { useStore } from '../lib/store'

export default function LoginMock() {
  const { login, USERS } = useStore()
  const [selected, setSelected] = useState(USERS[0].email)

  const user = USERS.find(u => u.email === selected)

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">📋</div>
        <div className="login-title">合約審閱系統</div>
        <div className="login-group">HQ ・ Mock 登入環境</div>

        <div className="form-group">
          <label className="form-label">選擇登入身份</label>
          <select
            className="form-control"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {USERS.map(u => (
              <option key={u.email} value={u.email}>
                {u.name} ── {u.role_desc}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <strong>{user.name}</strong> &nbsp;
            <span className="text-sm">({user.email})</span>
            <br />
            <span className="text-sm">{user.role_desc}・部門：{user.dept}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={() => login(selected)}
        >
          登入
        </button>

        <p className="login-hint">
          ⚠️ 本環境為 Mock 登入，僅供 Workflow 設計驗證使用
        </p>
      </div>
    </div>
  )
}
