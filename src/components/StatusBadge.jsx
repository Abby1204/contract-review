const STATUS_LABELS = {
  new:          '新建立',
  in_review:    '審閱中',
  mgr_pending:  '待主管審核',
  exec_pending: '待最高主管審核',
  approved:     '已核准',
  archived:     '已歸檔',
  returned:     '已退回',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
