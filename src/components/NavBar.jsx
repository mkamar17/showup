import { NavLink, useNavigate } from 'react-router-dom'
import { House, Images, LogOut, User, Users } from 'lucide-react'
import { useApp } from '../api/useApp'
import logo from '../assets/logo.svg'

const LINKS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function NavBar() {
  const { logout } = useApp()
  const navigate = useNavigate()

  return (
    <nav className="sidebar" aria-label="Main">
      <button type="button" className="sidebar__logo" onClick={() => navigate('/')} aria-label="Engine home">
        <img src={logo} alt="" width="44" height="44" />
      </button>
      <ul className="sidebar__links">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`} title={label}>
              <Icon size={22} />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="sidebar__link sidebar__logout"
        title="Log out"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        <LogOut size={22} />
        <span className="sidebar__label">Log out</span>
      </button>
    </nav>
  )
}
