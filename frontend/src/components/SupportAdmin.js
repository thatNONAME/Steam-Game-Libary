import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HelpCircle, Send, Loader2, Clock, CheckCircle, XCircle, MessageSquare, User } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_TABS = [
  { value: null, label: "All" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  open: { color: "text-yellow-400", icon: Clock },
  answered: { color: "text-green-400", icon: CheckCircle },
  closed: { color: "text-muted-foreground", icon: XCircle },
};

function isStaff(user) {
  if (!user) return false;
  if (user.is_owner) return true;
  const roles = user.roles || [];
  return roles.includes('Creator') || roles.includes('Admin') || roles.includes('Moderator');
}

export default function SupportAdmin({ user, token }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      const res = await axios.get(`${API}/support/all`, { headers: { Authorization: `Bearer ${token}` }, params });
      setTickets(res.data);
    } catch (err) {
      if (err.response?.status === 403) navigate("/");
    }
    finally { setLoading(false); }
  }, [token, statusFilter, navigate]);

  useEffect(() => {
    if (!isStaff(user)) { navigate("/"); return; }
    fetchTickets();
  }, [user, fetchTickets, navigate]);

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await axios.post(`${API}/support/${ticketId}/reply`, { message: replyText.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Reply sent & user notified");
      setSelectedTicket(res.data);
      setReplyText("");
      fetchTickets();
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setReplying(false); }
  };

  const handleClose = async (ticketId) => {
    try {
      await axios.post(`${API}/support/${ticketId}/close`, null, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Ticket closed");
      setSelectedTicket(null);
      fetchTickets();
    } catch { toast.error("Failed to close"); }
  };

  if (!isStaff(user)) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8" data-testid="support-admin">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Support Tickets</h1>
          <p className="text-muted-foreground text-sm">Review and respond to user reports</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button key={t.label} onClick={() => { setStatusFilter(t.value); setLoading(true); }} data-testid={`filter-${t.label.toLowerCase()}`}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === t.value ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket list */}
        <div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
          ) : tickets.length > 0 ? (
            <div className="space-y-2" data-testid="admin-tickets-list">
              {tickets.map((t) => {
                const st = STATUS_STYLES[t.status] || STATUS_STYLES.open;
                const StIcon = st.icon;
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button key={t.id} onClick={() => setSelectedTicket(t)} data-testid={`admin-ticket-${t.id}`}
                    className={`flex items-center gap-3 w-full p-4 rounded-xl border text-left transition-colors ${
                      isSelected ? "bg-primary/10 border-primary/30" : "bg-card/50 border-border/50 hover:bg-card/80"
                    }`}>
                    <StIcon className={`w-4 h-4 shrink-0 ${st.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{t.username}</span>
                        <span>·</span>
                        <span className="capitalize">{t.category}</span>
                        <span>·</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {t.replies?.length > 0 && <span className="text-xs text-primary">{t.replies.length}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No tickets {statusFilter ? `with status "${statusFilter}"` : ""}</p>
            </div>
          )}
        </div>

        {/* Ticket detail */}
        <div>
          {selectedTicket ? (
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden sticky top-24" data-testid="ticket-detail">
              <div className="p-5 border-b border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  {selectedTicket.avatar_url ? (
                    <img src={selectedTicket.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{selectedTicket.username}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                    selectedTicket.status === 'open' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                    selectedTicket.status === 'answered' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                    'bg-secondary/30 text-muted-foreground border border-border/50'
                  }`}>{selectedTicket.status}</span>
                </div>
                <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{selectedTicket.category} · {new Date(selectedTicket.created_at).toLocaleString()}</p>
              </div>
              <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
                <div className="rounded-lg bg-secondary/20 p-3">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
                {(selectedTicket.replies || []).map((r) => (
                  <div key={r.id} className={`rounded-lg p-3 ${r.author === 'user' ? 'bg-secondary/20 border border-border/30' : 'bg-primary/5 border border-primary/20'}`}>
                    <p className={`text-xs mb-1 font-medium ${r.author === 'user' ? 'text-muted-foreground' : 'text-primary'}`}>
                      {r.author === 'user' ? `${r.author_name || selectedTicket.username}` : `Staff (${r.author_name || 'Admin'})`} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t border-border/30 space-y-3">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    data-testid="admin-reply-input"
                    className="w-full h-20 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="Write your reply..." />
                  <div className="flex gap-2">
                    <Button onClick={() => handleReply(selectedTicket.id)} disabled={replying || !replyText.trim()} data-testid="admin-reply-btn" className="flex-1 rounded-full gap-2">
                      {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Reply
                    </Button>
                    <Button variant="outline" onClick={() => handleClose(selectedTicket.id)} data-testid="close-ticket-btn" className="rounded-full">
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/30 flex items-center justify-center h-64 text-muted-foreground text-sm">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
