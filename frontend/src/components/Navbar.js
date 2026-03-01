import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Menu, LogIn, LogOut, Gamepad2, User, Settings, Users, FolderHeart, Shield, Compass, HelpCircle, Bell } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SteamIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>
);

export default function Navbar({ user, theme, setTheme, onLogin, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const token = typeof window !== 'undefined' ? localStorage.getItem("steam_token") : null;

  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
        setUnreadCount(res.data.count || 0);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const NavLink = ({ to, children, icon: Icon, testId }) => (
    <button onClick={() => { navigate(to); setMobileOpen(false); }} data-testid={testId}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(to) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 glass" style={{ backgroundColor: "hsl(var(--background) / 0.85)" }} data-testid="navbar">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group" data-testid="logo">
            <Gamepad2 className="w-7 h-7 text-primary transition-transform group-hover:rotate-12" />
            <span className="text-xl font-bold tracking-tight font-['Outfit']">Game Library</span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={Gamepad2} testId="nav-library">Library</NavLink>
            {user && <NavLink to="/collections" icon={FolderHeart} testId="nav-collections">Collections</NavLink>}
            <NavLink to="/discover" icon={Compass} testId="nav-discover">Discover</NavLink>
            <NavLink to="/users" icon={Users} testId="nav-users">Users</NavLink>
            {user && <NavLink to="/settings" icon={Settings} testId="nav-settings">Settings</NavLink>}
            {user?.is_owner && <NavLink to="/admin" icon={Shield} testId="nav-admin">Admin</NavLink>}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/profile/${user.id}`)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary/70 transition-colors" data-testid="user-avatar-btn">
                  {user.avatar_url ? <img src={user.custom_avatar || user.avatar_url} alt="" className="w-6 h-6 rounded-full" /> : <User className="w-5 h-5" />}
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.display_name || user.username}</span>
                </button>
                <Button variant="ghost" size="sm" onClick={onLogout} data-testid="logout-btn" className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={onLogin} data-testid="login-btn" className="rounded-full gap-2 px-5">
                <SteamIcon className="w-4 h-4" />Login with Steam
              </Button>
            )}
          </div>
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" data-testid="mobile-menu-btn"><Menu className="w-5 h-5" /></Button></SheetTrigger>
              <SheetContent side="right" className="w-72 glass-heavy border-border/50">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLink to="/" icon={Gamepad2} testId="mobile-nav-library">Library</NavLink>
                  {user && <NavLink to="/collections" icon={FolderHeart} testId="mobile-nav-collections">Collections</NavLink>}
                  <NavLink to="/discover" icon={Compass} testId="mobile-nav-discover">Discover</NavLink>
                  <NavLink to="/users" icon={Users} testId="mobile-nav-users">Users</NavLink>
                  {user && <NavLink to="/settings" icon={Settings} testId="mobile-nav-settings">Settings</NavLink>}
                  {user?.is_owner && <NavLink to="/admin" icon={Shield} testId="mobile-nav-admin">Admin</NavLink>}
                  <div className="border-t border-border/50 pt-4">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Theme</span>
                    <ThemeSwitcher theme={theme} setTheme={setTheme} mobile />
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    {user ? (
                      <div className="space-y-3">
                        <button onClick={() => { navigate(`/profile/${user.id}`); setMobileOpen(false); }} className="flex items-center gap-3 px-2 w-full">
                          {user.avatar_url ? <img src={user.custom_avatar || user.avatar_url} alt="" className="w-10 h-10 rounded-full" /> : <User className="w-8 h-8" />}
                          <div className="text-left"><p className="font-medium text-sm">{user.display_name || user.username}</p><p className="text-xs text-muted-foreground">View Profile</p></div>
                        </button>
                        <Button variant="ghost" onClick={() => { onLogout(); setMobileOpen(false); }} data-testid="mobile-logout-btn" className="justify-start w-full"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
                      </div>
                    ) : (
                      <Button onClick={() => { onLogin(); setMobileOpen(false); }} data-testid="mobile-login-btn" className="w-full gap-2"><SteamIcon className="w-4 h-4" />Login with Steam</Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
