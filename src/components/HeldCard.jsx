import { useNavigate } from 'react-router-dom'
import { ChevronRight, Landmark, Lock } from 'lucide-react'
import { ME_ID } from '../api/constants'
import { useApp } from '../api/useApp'
import { formatMoney } from '../api/format'

// Compact mustard block: money held in your show up! Space.
export default function HeldCard() {
  const { state, me } = useApp()
  const navigate = useNavigate()
  const count = state.events.filter((e) => !e.settled && e.members[ME_ID]?.status === 'committed').length

  if (!me.starling) {
    return (
      <button type="button" className="held-card" onClick={() => navigate('/profile?tab=banking')}>
        <Landmark size={18} />
        <span className="held-card__text">
          <strong>Connect Starling</strong>
          <small>Needed before you can commit</small>
        </span>
        <ChevronRight size={18} />
      </button>
    )
  }

  return (
    <button type="button" className="held-card" onClick={() => navigate('/profile?tab=wallet')}>
      <Lock size={18} />
      <span className="held-card__text">
        <strong>{formatMoney(me.held)} held</strong>
        <small>
          across {count} event{count === 1 ? '' : 's'}
        </small>
      </span>
      <ChevronRight size={18} />
    </button>
  )
}
