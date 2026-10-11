import { PHASE_LABELS } from '../api/eventLogic'

const MEMBER_LABELS = {
  invited: 'Invited',
  committed: 'Committed',
  declined: 'Declined',
  checkedIn: 'Checked in',
  noShow: 'No-show',
  refunded: 'Refunded',
  excused: 'Excused · TfL',
  delayed: 'Delayed · TfL',
}

export function PhasePill({ phase }) {
  return <span className={`pill pill--phase-${phase}`}>{PHASE_LABELS[phase]}</span>
}

export function MemberPill({ status }) {
  return <span className={`pill pill--member-${status}`}>{MEMBER_LABELS[status]}</span>
}
