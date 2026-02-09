import { useEffect, useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import GameLibrary from "@/components/GameLibrary";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthCallback({ setToken, setUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("steam_token", token);
      setToken(token);
      toast.success("Logged in with Steam!");
    } else {
      toast.error("Login failed");
    }
    navigate("/", { replace: true });
  }, [searchParams, navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback">
      <div className="text-muted-foreground text-lg">Authenticating...</div>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("steam_token"));
  const [theme, setTheme] = useState(localStorage.getItem("nebula_theme") || "dark-blue");
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nebula_theme", theme);
  }, [theme]);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      toast.error(`Login error: ${authError.replace(/_/g, " ")}`);
    }
  }, [searchParams]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem("steam_token");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogin = () => {
    window.location.href = `${API}/auth/steam/login`;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("steam_token");
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <main>
        <Routes>
          <Route
            path="/"
            element={<GameLibrary user={user} token={token} />}
          />
          <Route
            path="/auth/callback"
            element={<AuthCallback setToken={setToken} setUser={setUser} />}
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
