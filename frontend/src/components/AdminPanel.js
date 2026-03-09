import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Search, UserCheck, X, Loader2, Ban, CheckCircle } from "lucide-react";
import { RoleBadges } from "@/components/RoleBadge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ROLES = [
  { name: "Creator", color: "bg-purple-500 hover:bg-purple-600" },
  { name: "Admin", color: "bg-red-500 hover:bg-red-600" },
  { name: "Moderator", color: "bg-yellow-500 hover:bg-yellow-600 text-black" },
  { name: "Tester", color: "bg-green-500 hover:bg-green-600" },
];

function isAdminOrAbove(user) {
  if (!user) return false;
  if (user.is_owner) return true;
  const roles = user.roles || [];
  return roles.includes('Creator') || roles.includes('Admin');
}

export default function AdminPanel({ user, token }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [banning, setBanning] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/roles/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403) navigate("/");
    }
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => {
    if (!isAdminOrAbove(user)) { navigate("/"); return; }
    fetchUsers();
  }, [user, fetchUsers, navigate]);

  const handleAssign = async (userId, role) => {
    setAssigning(`${userId}-${role}`);
    try {
      await axios.post(`${API}/roles/assign`, { target_user_id: userId, role }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Assigned ${role} role`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setAssigning(null); }
  };

  const handleRemove = async (userId, role) => {
    setAssigning(`${userId}-${role}-rm`);
    try {
      await axios.post(`${API}/roles/remove`, { target_user_id: userId, role }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Removed ${role} role`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setAssigning(null); }
  };

  const handleBan = async (userId) => {
    setBanning(userId);
    try {
      await axios.post(`${API}/ban/${userId}`, null, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("User banned — profile hidden, commenting disabled");
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || "Failed to ban"); }
    finally { setBanning(null); }
  };

  const handleUnban = async (userId) => {
    setBanning(userId);
    try {
      await axios.post(`${API}/unban/${userId}`, null, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("User unbanned");
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || "Failed to unban"); }
    finally { setBanning(null); }
  };

  const filtered = searchQuery.trim()
    ? users.filter((u) =>
        (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.display_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (!isAdminOrAbove(user)) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8" data-testid="admin-panel">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage roles and user bans</p>
        </div>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..."
          data-testid="admin-search" className="pl-10 bg-secondary/30 border-border/50 rounded-full" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <span key={r.name} className={`px-3 py-1 rounded-full text-xs font-medium text-white ${r.color}`}>{r.name}</span>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3" data-testid="admin-user-list">
          {filtered.map((u) => {
            const userRoles = u.roles || [];
            const avatar = u.custom_avatar || u.avatar_url;
            const isBanned = u.is_banned;
            const isCreator = u.steam_id === '76561199491242446';
            return (
              <div key={u.id} className={`p-4 rounded-xl border bg-card/50 ${isBanned ? 'border-destructive/40 bg-destructive/5' : 'border-border/50'}`} data-testid={`admin-user-${u.id}`}>
                <div className="flex items-center gap-3 mb-3">
                  {avatar ? <img src={avatar} alt="" className="w-10 h-10 rounded-full" /> : <UserCheck className="w-8 h-8 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{u.display_name || u.username}</p>
                      <RoleBadges roles={userRoles} />
                      {isBanned && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/20 text-destructive border border-destructive/30">BANNED</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                  {/* Ban/Unban button */}
                  {!isCreator && (
                    isBanned ? (
                      <Button size="sm" variant="outline" onClick={() => handleUnban(u.id)} disabled={banning === u.id} data-testid={`unban-${u.id}`}
                        className="gap-1.5 text-xs rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10">
                        {banning === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleBan(u.id)} disabled={banning === u.id} data-testid={`ban-${u.id}`}
                        className="gap-1.5 text-xs rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                        {banning === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}Ban
                      </Button>
                    )
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const hasRole = userRoles.includes(r.name);
                    const key = `${u.id}-${r.name}`;
                    return hasRole ? (
                      <Button key={r.name} size="sm" variant="outline" onClick={() => handleRemove(u.id, r.name)}
                        disabled={assigning === `${key}-rm`} data-testid={`remove-role-${u.id}-${r.name.toLowerCase()}`}
                        className="gap-1.5 text-xs rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                        {assigning === `${key}-rm` ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        Remove {r.name}
                      </Button>
                    ) : (
                      <Button key={r.name} size="sm" onClick={() => handleAssign(u.id, r.name)}
                        disabled={assigning === key} data-testid={`assign-role-${u.id}-${r.name.toLowerCase()}`}
                        className={`gap-1.5 text-xs rounded-full text-white ${r.color}`}>
                        {assigning === key ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        + {r.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No users found</p>}
        </div>
      )}
    </div>
  );
}
