// Sidebar: brand, search, navigation, balance, notifications and profile.
// On mobile it becomes a compact header plus a bottom tab bar.
import { NavLink, useNavigate } from 'react-router-dom'
import { House, Images, Landmark, LogOut, User, Users, Wallet } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatMoney } from '../api/format'
import Avatar from './Avatar'
import SearchBar from './SearchBar'
import NotificationDropdown from './NotificationDropdown'
import showupBannerWine from '../assets/showup-banner-wine-cropped.png'
import showupBanner from '../assets/showup-banner-white-cropped.png'

const LINKS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function NavBar() {
  const { me, logout } = useApp()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <button type="button" className="sidebar__brand" onClick={() => navigate('/')} aria-label="show up! home">
        <picture className="sidebar__brand-reveal">
          <source media="(max-width: 900px)" srcSet={showupBannerWine} />
          <img className="sidebar__brand-image" src={showupBanner} alt="show up!" />
        </picture>
      </button>

      <div className="sidebar__search">
        <SearchBar />
      </div>

      <nav className="sidebar__nav" aria-label="Main">
        <ul className="sidebar__links">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
                <Icon size={20} />
                <span className="sidebar__label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__bottom">
        <button
          type="button"
          className="sidebar__balance"
          onClick={() => navigate(me.starling ? '/profile?tab=wallet' : '/profile?tab=banking')}
        >
          {me.starling ? <Wallet size={18} /> : <Landmark size={18} />}
          <span className="sidebar__balance-text">
            <small>{me.starling ? 'Starling balance' : 'No bank connected'}</small>
            <strong>{me.starling ? formatMoney(me.balance) : 'Connect Starling'}</strong>
          </span>
        </button>

        <NotificationDropdown />

        <div className="sidebar__profile">
          <button type="button" className="sidebar__me" onClick={() => navigate('/profile')}>
            <Avatar user={me} size={40} />
            <span className="sidebar__me-text">
              <strong>{me.name}</strong>
              <small>@{me.username}</small>
            </span>
          </button>
          <button
            type="button"
            className="sidebar__logout"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
