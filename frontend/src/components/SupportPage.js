import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Send, Loader2, MessageSquare, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "account", label: "Account Issue" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Question" },
];

const STATUS_STYLES = {
  open: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", icon: Clock, label: "Open" },
  answered: { color: "text-green-400 bg-green-500/10 border-green-500/30", icon: CheckCircle, label: "Answered" },
  closed: { color: "text-muted-foreground bg-secondary/30 border-border/50", icon: CheckCircle, label: "Closed" },
};

export default function SupportPage({ user, token }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [form, setForm] = useState({ subject: "", message: "", category: "general" });

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/support/my`, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetchTickets();
  }, [user, fetchTickets, navigate]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) { toast.error("Please fill in all fields"); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/support`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Ticket submitted! We'll get back to you soon.");
      setForm({ subject: "", message: "", category: "general" });
      setShowForm(false);
      fetchTickets();
    } catch (err) { toast.error(err.response?.data?.error || "Failed to submit"); }
    finally { setSubmitting(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8" data-testid="support-page">
      <div className="text-center mb-8">
        <HelpCircle className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Support</h1>
        <p className="text-muted-foreground text-sm mt-1">Need help? Submit a ticket and we'll get back to you</p>
        <p className="text-xs text-muted-foreground mt-2">Or email us at <a href="mailto:suportgamelibary@gmail.com" className="text-primary hover:underline">suportgamelibary@gmail.com</a></p>
      </div>

      <div className="mb-6">
        <Button onClick={() => setShowForm(!showForm)} className="rounded-full gap-2" data-testid="new-ticket-btn">
          <MessageSquare className="w-4 h-4" />{showForm ? "Cancel" : "New Ticket"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 mb-8 space-y-4" data-testid="ticket-form">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setForm({ ...form, category: c.value })} data-testid={`category-${c.value}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.category === c.value ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/50"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Subject</label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              data-testid="ticket-subject" className="bg-secondary/30 border-border/50" placeholder="Brief description of your issue" maxLength={200} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Message</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              data-testid="ticket-message" className="w-full h-32 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder="Describe your issue in detail..." maxLength={2000} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} data-testid="submit-ticket-btn" className="w-full rounded-full gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Submit Ticket
          </Button>
        </div>
      )}

      <h2 className="text-lg font-semibold font-['Outfit'] mb-4">My Tickets ({tickets.length})</h2>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3" data-testid="tickets-list">
          {tickets.map((t) => {
            const st = STATUS_STYLES[t.status] || STATUS_STYLES.open;
            const StIcon = st.icon;
            const isExpanded = expandedTicket === t.id;
            return (
              <div key={t.id} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden" data-testid={`ticket-${t.id}`}>
                <button onClick={() => setExpandedTicket(isExpanded ? null : t.id)}
                  className="flex items-center gap-3 w-full p-4 text-left hover:bg-card/80 transition-colors">
                  <StIcon className={`w-4 h-4 shrink-0 ${st.color.split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${st.color}`}>{st.label}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      <span className="capitalize">{t.category}</span>
                      {t.replies?.length > 0 && <span className="text-primary">{t.replies.length} {t.replies.length === 1 ? "reply" : "replies"}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border/30 p-4 space-y-3">
                    <div className="rounded-lg bg-secondary/20 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Your message:</p>
                      <p className="text-sm whitespace-pre-wrap">{t.message}</p>
                    </div>
                    {(t.replies || []).map((r) => (
                      <div key={r.id} className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <p className="text-xs text-primary mb-1 font-medium">Admin Reply · {new Date(r.created_at).toLocaleDateString()}</p>
                        <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                      </div>
                    ))}
                    {t.replies?.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Waiting for a response...</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No tickets yet. Submit one if you need help!</p>
        </div>
      )}
    </div>
  );
}
