import { createContext, useContext, useState, useCallback } from 'react'
import { SEED_DATA, CENTRAL_COORDINATORS, TOP_MANAGER_EMAIL, USERS, CATEGORIES, CATEGORY_READ_ACCESS } from './mockData'

const StoreContext = createContext(null)

function loadState() {
  try {
    const saved = localStorage.getItem('contract-review-v1')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ...SEED_DATA, currentUserEmail: null }
}

function saveState(state) {
  try {
    localStorage.setItem('contract-review-v1', JSON.stringify(state))
  } catch {}
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => loadState())

  const update = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveState(next)
      return next
    })
  }, [])

  const currentUser = USERS.find(u => u.email === state.currentUserEmail) || null

  const isCentralCoordinator = (email) => CENTRAL_COORDINATORS.includes(email)
  const isTopManager = (email) => email === TOP_MANAGER_EMAIL
  const getCategoryById = (id) => CATEGORIES.find(c => c.id === id)
  const getUserByEmail = (email) => USERS.find(u => u.email === email)

  const canSeeContract = (contract, userEmail) => {
    if (isCentralCoordinator(userEmail)) return true
    if (contract.opened_by === userEmail) return true
    if (contract.manager_email === userEmail) return true
    if (contract.exec_email === userEmail) return true
    const isActiveParticipant = state.participants.some(
      p => p.contract_id === contract.id && p.email === userEmail && p.status === 'active'
    )
    if (isActiveParticipant) return true
    const user = USERS.find(u => u.email === userEmail)
    const rules = CATEGORY_READ_ACCESS.filter(r => r.category_id === contract.category_id)
    return rules.some(rule => {
      if (rule.type === 'user') return rule.value === userEmail
      if (rule.type === 'department_prefix') return user?.dept?.startsWith(rule.value)
      if (rule.type === 'department_exact') return user?.dept === rule.value
      return false
    })
  }

  const getVisibleContracts = (userEmail) =>
    state.contracts.filter(c => canSeeContract(c, userEmail))

  const getContractProgress = (contractId) => {
    const active = state.participants.filter(p => p.contract_id === contractId && p.status === 'active')
    const submitted = state.comments.filter(c => c.contract_id === contractId && c.is_active && c.status === 'submitted')
    return { total: active.length, submitted: submitted.length, allDone: active.length > 0 && submitted.length >= active.length }
  }

  const getTodos = (userEmail) => {
    const todos = []
    const contracts = getVisibleContracts(userEmail)
    for (const contract of contracts) {
      const myParticipant = state.participants.find(
        p => p.contract_id === contract.id && p.email === userEmail && p.status === 'active'
      )
      const myComment = myParticipant
        ? state.comments.find(c => c.contract_id === contract.id && c.participant_id === myParticipant.id && c.is_active)
        : null

      if (myParticipant && ['in_review', 'returned'].includes(contract.status) && myComment?.status === 'draft') {
        todos.push({ contract, reason: '尚未提交意見', type: 'comment' })
        continue
      }
      if (contract.manager_email === userEmail && contract.status === 'mgr_pending') {
        todos.push({ contract, reason: '等待主管審核', type: 'approve' })
        continue
      }
      if (contract.exec_email === userEmail && contract.status === 'exec_pending') {
        todos.push({ contract, reason: '等待最終審核', type: 'approve' })
        continue
      }
      const isCoordinator = contract.opened_by === userEmail || isCentralCoordinator(userEmail)
      if (isCoordinator && contract.status === 'in_review') {
        const { allDone } = getContractProgress(contract.id)
        if (allDone) todos.push({ contract, reason: '全員已提交，可送審', type: 'submit' })
      }
      if (isCentralCoordinator(userEmail) && contract.status === 'approved') {
        todos.push({ contract, reason: '可觸發歸檔', type: 'archive' })
      }
      if (isCentralCoordinator(userEmail) && contract.status === 'exec_pending') {
        todos.push({ contract, reason: 'Manual Remind', type: 'remind' })
      }
    }
    return todos
  }

  // ── Actions ──────────────────────────────────────────────
  const login = (email) => update({ currentUserEmail: email })
  const logout = () => update({ currentUserEmail: null })

  const createContract = ({ title, category_id, manager_email, exec_email, approval_layers, file_path }) => {
    const id = state.nextIds.contracts
    const contract = {
      id, uuid: `c${String(id).padStart(3, '0')}-${Date.now()}`,
      title, category_id: parseInt(category_id), status: 'new',
      approval_layers: parseInt(approval_layers),
      opened_by: state.currentUserEmail,
      manager_email,
      exec_email: parseInt(approval_layers) === 2 ? exec_email : null,
      file_path: file_path || 'contract.pdf',
      created_at: new Date().toISOString(), submitted_at: null, archived_at: null,
    }
    update(s => ({
      ...s,
      contracts: [...s.contracts, contract],
      nextIds: { ...s.nextIds, contracts: s.nextIds.contracts + 1 },
    }))
    return id
  }

  const inviteParticipant = (contractId, email, roleLabel) => {
    update(s => {
      const pId = s.nextIds.participants
      const cId = s.nextIds.comments
      const participant = {
        id: pId, contract_id: contractId, email, role_label: roleLabel,
        status: 'active', invited_by: s.currentUserEmail, invited_at: new Date().toISOString(),
      }
      const comment = {
        id: cId, contract_id: contractId, participant_id: pId,
        content: '', status: 'draft', is_active: true,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(), submitted_at: null,
      }
      return {
        ...s,
        contracts: s.contracts.map(c =>
          c.id === contractId && c.status === 'new' ? { ...c, status: 'in_review' } : c
        ),
        participants: [...s.participants, participant],
        comments: [...s.comments, comment],
        nextIds: { ...s.nextIds, participants: pId + 1, comments: cId + 1 },
      }
    })
  }

  const removeParticipant = (contractId, participantId) => {
    update(s => ({
      ...s,
      participants: s.participants.map(p => p.id === participantId ? { ...p, status: 'removed' } : p),
      comments: s.comments.map(c => c.participant_id === participantId ? { ...c, is_active: false } : c),
    }))
  }

  const updateComment = (commentId, content) => {
    update(s => ({
      ...s,
      comments: s.comments.map(c =>
        c.id === commentId ? { ...c, content, updated_at: new Date().toISOString() } : c
      ),
    }))
  }

  const submitComment = (commentId) => {
    update(s => ({
      ...s,
      comments: s.comments.map(c =>
        c.id === commentId
          ? { ...c, status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          : c
      ),
    }))
  }

  const submitToManager = (contractId) => {
    update(s => ({
      ...s,
      contracts: s.contracts.map(c =>
        c.id === contractId ? { ...c, status: 'mgr_pending', submitted_at: new Date().toISOString() } : c
      ),
    }))
  }

  const approveContract = (contractId) => {
    update(s => {
      const contract = s.contracts.find(c => c.id === contractId)
      let newStatus = 'approved'
      if (contract.status === 'mgr_pending' && contract.approval_layers === 2) {
        newStatus = 'exec_pending'
      }
      return {
        ...s,
        contracts: s.contracts.map(c => c.id === contractId ? { ...c, status: newStatus } : c),
      }
    })
  }

  const returnContract = (contractId) => {
    update(s => ({
      ...s,
      contracts: s.contracts.map(c =>
        c.id === contractId ? { ...c, status: 'returned' } : c
      ),
      comments: s.comments.map(c =>
        c.contract_id === contractId && c.is_active
          ? { ...c, status: 'draft', submitted_at: null }
          : c
      ),
    }))
  }

  const resubmitAfterReturn = (contractId) => {
    update(s => ({
      ...s,
      contracts: s.contracts.map(c =>
        c.id === contractId ? { ...c, status: 'in_review' } : c
      ),
    }))
  }

  const archiveContract = (contractId) => {
    update(s => ({
      ...s,
      contracts: s.contracts.map(c =>
        c.id === contractId
          ? { ...c, status: 'archived', archived_at: new Date().toISOString() }
          : c
      ),
    }))
  }

  const resetData = () => {
    const fresh = { ...SEED_DATA, currentUserEmail: state.currentUserEmail }
    update(() => fresh)
  }

  const value = {
    currentUser,
    contracts: state.contracts,
    participants: state.participants,
    comments: state.comments,
    isCentralCoordinator,
    isTopManager,
    getCategoryById,
    getUserByEmail,
    canSeeContract,
    getVisibleContracts,
    getContractProgress,
    getTodos,
    login,
    logout,
    createContract,
    inviteParticipant,
    removeParticipant,
    updateComment,
    submitComment,
    submitToManager,
    approveContract,
    returnContract,
    resubmitAfterReturn,
    archiveContract,
    resetData,
    USERS,
    CATEGORIES,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
