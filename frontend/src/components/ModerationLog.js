import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ClipboardList, Shield, Ban, UserCheck, Award } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACTION_STYLES = {
  ban: { icon: Ban, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Ban" },
  unban: { icon: UserCheck, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Unban" },
  unban_appeal: { icon: UserCheck, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Appeal Approved" },
  role_assign: { icon: Award, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", label: "Role Assigned" },
  role_remove: { icon: Award, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Role Removed" },
};

function isStaff(user) {
  if (!user) return false;
  if (user.is_owner) return true;
  const roles = user.roles || [];
  return roles.includes('Creator') || roles.includes('Admin') || roles.includes('Moderator');
}

export default function ModerationLog({ user, token }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [tab, setTab] = useState("log");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStaff(user)) { navigate("/"); return; }
    const load = async () => {
      try {
        const [logRes, appealRes] = await Promise.all([
          axios.get(`${API}/modlog`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/appeals/all`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setLogs(logRes.data);
        setAppeals(appealRes.data);
      } catch (err) { if (err.response?.status === 403) navigate("/"); }
      finally { setLoading(false); }
    };
    load();
  }, [user, token, navigate]);

  const handleReview = async (appealId, action) => {
    const response = action === 'approve' ? 'Your ban has been lifted.' : 'Appeal denied after review.';
    try {
      await axios.post(`${API}/appeals/${appealId}/review?action=${action}&response=${encodeURIComponent(response)}`, null, { headers: { Authorization: `Bearer ${token}` } });
      // Refresh data
      const [logRes, appealRes] = await Promise.all([
        axios.get(`${API}/modlog`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/appeals/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLogs(logRes.data);
      setAppeals(appealRes.data);
    } catch { /* ignore */ }
  };

  if (!isStaff(user)) return null;

  const pendingAppeals = appeals.filter((a) => a.status === 'pending');

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8" data-testid="moderation-log">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Moderation</h1>
          <p className="text-muted-foreground text-sm">Activity log and ban appeals</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "log", label: "Activity Log" },
          { key: "appeals", label: `Appeals${pendingAppeals.length > 0 ? ` (${pendingAppeals.length})` : ""}` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`modlog-tab-${t.key}`}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${
              tab === t.key ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : tab === "log" ? (
        logs.length > 0 ? (
          <div className="space-y-2" data-testid="modlog-list">
            {logs.map((log) => {
              const style = ACTION_STYLES[log.action] || ACTION_STYLES.ban;
              const ActionIcon = style.icon;
              return (
                <div key={log.id} className={`flex items-center gap-3 p-4 rounded-xl border ${style.bg}`} data-testid={`modlog-${log.id}`}>
                  <ActionIcon className={`w-4 h-4 shrink-0 ${style.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">{log.performed_by}</span> · <span className={`font-medium ${style.color}`}>{style.label}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.details}{log.target_username ? ` — @${log.target_username}` : ''}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No moderation actions yet</p>
          </div>
        )
      ) : (
        appeals.length > 0 ? (
          <div className="space-y-3" data-testid="appeals-list">
            {appeals.map((a) => (
              <div key={a.id} className={`p-4 rounded-xl border ${a.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50 bg-card/50'}`} data-testid={`appeal-${a.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{a.username}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${
                    a.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    a.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>{a.status}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap mb-3">{a.reason}</p>
                {a.staff_response && <p className="text-xs text-primary border-l-2 border-primary/30 pl-3 mb-3">{a.staff_response}</p>}
                {a.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(a.id, 'approve')} data-testid={`approve-appeal-${a.id}`}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors">
                      Approve & Unban
                    </button>
                    <button onClick={() => handleReview(a.id, 'deny')} data-testid={`deny-appeal-${a.id}`}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">
                      Deny
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No ban appeals</p>
          </div>
        )
      )}
    </div>
  );
}
