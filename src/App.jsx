import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./api/useApp";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import EventDetailPage from "./pages/EventDetailPage";
import SettlementPage from "./pages/SettlementPage";
import CommunityPage from "./pages/CommunityPage";
import MemoriesPage from "./pages/MemoriesPage";
import MemoryDetailPage from "./pages/MemoryDetailPage";
import ProfilePage from "./pages/ProfilePage";

// Routes:
//   /            public landing page (everyone, signed in or not)
//   /login       log in / sign up (signed-in users go on to the dashboard)
//   /dashboard   the app's home, plus every page below: sign-in required
export default function App() {
  const { state } = useApp();
  const signedIn = Boolean(state.session);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={signedIn ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      <Route element={signedIn ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route
          path="/events/:eventId/settlement"
          element={<SettlementPage />}
        />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/memories/:eventId" element={<MemoryDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={signedIn ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}
