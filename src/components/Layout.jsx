import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import TopBar from './TopBar'
import Toasts from './Toasts'
import '../styles/layout.css'

export default function Layout() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <TopBar />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
      <Toasts />
    </div>
  )
}
