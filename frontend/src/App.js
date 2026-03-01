import { useEffect, useState, useCallback, useMemo } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import GameLibrary from "@/components/GameLibrary";
import ProfilePage from "@/components/ProfilePage";
import SharedCollection from "@/components/SharedCollection";
import UserSearch from "@/components/UserSearch";
import ProfileSettings from "@/components/ProfileSettings";
import CollectionsPage from "@/components/CollectionsPage";
import AdminPanel from "@/components/AdminPanel";
import FollowersPage from "@/components/FollowersPage";
import DiscoverPage from "@/components/DiscoverPage";
import SupportPage from "@/components/SupportPage";
import SupportAdmin from "@/components/SupportAdmin";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthCallback({ setToken }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) { localStorage.setItem("steam_token", token); setToken(token); toast.success("Logged in with Steam!"); }
    else { toast.error("Login failed"); }
    navigate("/", { replace: true });
  }, [searchParams, navigate, setToken]);
  return <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback"><div className="text-muted-foreground text-lg">Authenticating...</div></div>;
}

function SpaceStars() {
  const stars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1, duration: `${6 + Math.random() * 10}s`, delay: `${Math.random() * 8}s`,
  })), []);
  return <div className="stars-container">{stars.map((s) => <div key={s.id} className="star" style={{ left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`, '--duration': s.duration, '--delay': s.delay }} />)}</div>;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("steam_token"));
  const [theme, setTheme] = useState(localStorage.getItem("nebula_theme") || "dark-blue");
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("nebula_theme", theme); }, [theme]);
  useEffect(() => { const err = searchParams.get("auth_error"); if (err) toast.error(`Login error: ${err.replace(/_/g, " ")}`); }, [searchParams]);

  const fetchUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    } catch { setToken(null); setUser(null); localStorage.removeItem("steam_token"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleLogin = () => { window.location.href = `${API}/auth/steam/login`; };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.removeItem("steam_token"); toast.success("Logged out"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen relative">
      {theme === "space" && <SpaceStars />}
      <div className="relative z-10">
        <Navbar user={user} theme={theme} setTheme={setTheme} onLogin={handleLogin} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<GameLibrary user={user} token={token} />} />
            <Route path="/auth/callback" element={<AuthCallback setToken={setToken} />} />
            <Route path="/collections" element={<CollectionsPage user={user} token={token} />} />
            <Route path="/collection/:id" element={<SharedCollection />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile/:userId/followers" element={<FollowersPage />} />
            <Route path="/settings" element={<ProfileSettings user={user} token={token} onUpdate={fetchUser} />} />
            <Route path="/users" element={<UserSearch />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/support" element={<SupportPage user={user} token={token} />} />
            <Route path="/support/admin" element={<SupportAdmin user={user} token={token} />} />
            <Route path="/admin" element={<AdminPanel user={user} token={token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" } }} />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
