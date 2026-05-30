export const USERS = [
  { email: 'abby@company.com', name: 'Abby', dept: 'HQACC', role_desc: 'Central Coordinator' },
  { email: 'amy@company.com', name: 'Amy', dept: 'HQACC01', role_desc: '一般員工（開案者）' },
  { email: 'john@company.com', name: 'John', dept: 'HQACC02', role_desc: '參與者 AP' },
  { email: 'lisa@company.com', name: 'Lisa', dept: 'HQACC02', role_desc: '參與者 FA' },
  { email: 'peter@company.com', name: 'Peter', dept: 'HQMGR', role_desc: '主管' },
  { email: 'mary@company.com', name: 'Mary', dept: 'HQEXEC', role_desc: 'Top Manager' },
  { email: 'tom@company.com', name: 'Tom', dept: 'HQOPS', role_desc: '一般員工（唯讀）' },
]

export const CENTRAL_COORDINATORS = ['abby@company.com']
export const TOP_MANAGER_EMAIL = 'mary@company.com'

export const CATEGORIES = [
  { id: 1, name: 'general', display_name: 'General（一般）', is_default: true },
  { id: 2, name: 'customer', display_name: 'Customer（機密客戶）', is_default: false },
]

export const CATEGORY_READ_ACCESS = [
  { category_id: 1, type: 'department_prefix', value: 'HQACC' },
  { category_id: 1, type: 'user', value: 'peter@company.com' },
  { category_id: 2, type: 'user', value: 'abby@company.com' },
  { category_id: 2, type: 'user', value: 'amy@company.com' },
  { category_id: 2, type: 'user', value: 'john@company.com' },
  { category_id: 2, type: 'user', value: 'lisa@company.com' },
]

export const SEED_DATA = {
  contracts: [
    {
      id: 1, uuid: 'c001-1001',
      title: '2024年度辦公室耗材採購合約',
      category_id: 1, status: 'in_review', approval_layers: 1,
      opened_by: 'amy@company.com', manager_email: 'peter@company.com', exec_email: null,
      file_path: 'contract_2024_supplies.pdf',
      created_at: '2024-05-01T09:00:00', submitted_at: null, archived_at: null,
    },
    {
      id: 2, uuid: 'c002-1002',
      title: '客戶A VIP服務合約',
      category_id: 2, status: 'mgr_pending', approval_layers: 2,
      opened_by: 'amy@company.com', manager_email: 'peter@company.com', exec_email: 'mary@company.com',
      file_path: 'contract_client_a.pdf',
      created_at: '2024-05-10T10:00:00', submitted_at: '2024-05-15T14:00:00', archived_at: null,
    },
    {
      id: 3, uuid: 'c003-1003',
      title: 'IT設備維護服務合約',
      category_id: 1, status: 'exec_pending', approval_layers: 2,
      opened_by: 'amy@company.com', manager_email: 'peter@company.com', exec_email: 'mary@company.com',
      file_path: 'contract_it_maint.pdf',
      created_at: '2024-04-20T09:00:00', submitted_at: '2024-04-25T11:00:00', archived_at: null,
    },
    {
      id: 4, uuid: 'c004-1004',
      title: '年度清潔服務合約',
      category_id: 1, status: 'approved', approval_layers: 1,
      opened_by: 'amy@company.com', manager_email: 'peter@company.com', exec_email: null,
      file_path: 'contract_cleaning.pdf',
      created_at: '2024-04-01T09:00:00', submitted_at: '2024-04-05T14:00:00', archived_at: null,
    },
  ],
  participants: [
    { id: 1, contract_id: 1, email: 'john@company.com', role_label: 'AP', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-05-01T09:30:00' },
    { id: 2, contract_id: 1, email: 'lisa@company.com', role_label: 'FA', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-05-01T09:30:00' },
    { id: 3, contract_id: 2, email: 'john@company.com', role_label: 'AP', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-05-10T10:30:00' },
    { id: 4, contract_id: 2, email: 'lisa@company.com', role_label: 'FA', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-05-10T10:30:00' },
    { id: 5, contract_id: 3, email: 'john@company.com', role_label: 'AP', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-04-20T10:00:00' },
    { id: 6, contract_id: 3, email: 'lisa@company.com', role_label: 'FA', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-04-20T10:00:00' },
    { id: 7, contract_id: 4, email: 'john@company.com', role_label: 'AP', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-04-01T10:00:00' },
    { id: 8, contract_id: 4, email: 'lisa@company.com', role_label: 'FA', status: 'active', invited_by: 'amy@company.com', invited_at: '2024-04-01T10:00:00' },
  ],
  comments: [
    { id: 1, contract_id: 1, participant_id: 1, content: '已核對採購清單，金額合理，建議核准。', status: 'draft', is_active: true, created_at: '2024-05-02T10:00:00', updated_at: '2024-05-02T10:00:00', submitted_at: null },
    { id: 2, contract_id: 1, participant_id: 2, content: '', status: 'draft', is_active: true, created_at: '2024-05-01T09:30:00', updated_at: '2024-05-01T09:30:00', submitted_at: null },
    { id: 3, contract_id: 2, participant_id: 3, content: '帳款條件符合規定，建議核准。', status: 'submitted', is_active: true, created_at: '2024-05-11T09:00:00', updated_at: '2024-05-15T13:00:00', submitted_at: '2024-05-15T13:00:00' },
    { id: 4, contract_id: 2, participant_id: 4, content: '財務面無異議，金額在預算範圍內。', status: 'submitted', is_active: true, created_at: '2024-05-11T09:00:00', updated_at: '2024-05-14T16:00:00', submitted_at: '2024-05-14T16:00:00' },
    { id: 5, contract_id: 3, participant_id: 5, content: '設備維護條款合理，廠商信譽良好。', status: 'submitted', is_active: true, created_at: '2024-04-21T09:00:00', updated_at: '2024-04-24T15:00:00', submitted_at: '2024-04-24T15:00:00' },
    { id: 6, contract_id: 3, participant_id: 6, content: '費用結構清晰，符合預算規範。', status: 'submitted', is_active: true, created_at: '2024-04-21T09:00:00', updated_at: '2024-04-23T14:00:00', submitted_at: '2024-04-23T14:00:00' },
    { id: 7, contract_id: 4, participant_id: 7, content: '清潔服務合約條款標準，建議核准。', status: 'submitted', is_active: true, created_at: '2024-04-02T09:00:00', updated_at: '2024-04-04T15:00:00', submitted_at: '2024-04-04T15:00:00' },
    { id: 8, contract_id: 4, participant_id: 8, content: '財務條款無異議。', status: 'submitted', is_active: true, created_at: '2024-04-02T09:00:00', updated_at: '2024-04-03T14:00:00', submitted_at: '2024-04-03T14:00:00' },
  ],
  nextIds: { contracts: 10, participants: 10, comments: 10 },
}
