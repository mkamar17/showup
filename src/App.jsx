import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './api/useApp'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import EventDetailPage from './pages/EventDetailPage'
import SettlementPage from './pages/SettlementPage'
import CommunityPage from './pages/CommunityPage'
import MemoriesPage from './pages/MemoriesPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const { state } = useApp()

  if (!state.session) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/:eventId/settlement" element={<SettlementPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
