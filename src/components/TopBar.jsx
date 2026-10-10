import { useLocation, useNavigate } from 'react-router-dom'
import { Landmark, Wallet } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatMoney } from '../api/format'
import Avatar from './Avatar'
import SearchBar from './SearchBar'
import NotificationDropdown from './NotificationDropdown'

function titleFor(pathname) {
  if (pathname === '/') return ['Primary', 'Dashboard']
  if (pathname.endsWith('/settlement')) return ['Event', 'Settlement']
  if (pathname.startsWith('/events')) return ['Event', 'Details']
  if (pathname.startsWith('/community')) return ['Friends', 'Community']
  if (pathname.startsWith('/memories')) return ['Looking back', 'Memories']
  if (pathname.startsWith('/profile')) return ['Account', 'Profile']
  return ['Engine', '']
}

export default function TopBar() {
  const { me } = useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [kicker, title] = titleFor(pathname)

  return (
    <header className="topbar">
      <div className="topbar__title">
        <span className="topbar__kicker">{kicker}</span>
        <h1>{title}</h1>
      </div>
      <SearchBar />
      <div className="topbar__actions">
        <button
          type="button"
          className="wallet-chip"
          onClick={() => navigate(me.starling ? '/profile?tab=wallet' : '/profile?tab=banking')}
          title={me.starling ? 'Starling balance' : 'Connect Starling'}
        >
          {me.starling ? <Wallet size={16} /> : <Landmark size={16} />}
          {me.starling ? formatMoney(me.balance) : 'Connect bank'}
        </button>
        <NotificationDropdown />
        <button type="button" className="topbar__avatar" onClick={() => navigate('/profile')} aria-label="Your profile">
          <Avatar user={me} size={44} />
        </button>
      </div>
    </header>
  )
}
