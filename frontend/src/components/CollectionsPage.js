import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderHeart, Share2, Trash2, Edit2, Loader2, Globe, Lock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CollectionsPage({ user, token }) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", is_public: true, game_ids: [] });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) { navigate("/"); return; }
    try {
      const [cRes, gRes] = await Promise.all([
        axios.get(`${API}/collections`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/games`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCollections(cRes.data);
      setGames(gRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/collections/${editingId}`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Collection updated");
      } else {
        await axios.post(`${API}/collections`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Collection created");
      }
      setCreateOpen(false); setEditingId(null);
      setForm({ name: "", description: "", is_public: true, game_ids: [] });
      fetchData();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/collections/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Collection deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const startEdit = (c) => {
    setForm({ name: c.name, description: c.description || "", is_public: c.is_public, game_ids: c.game_ids || [] });
    setEditingId(c.id); setCreateOpen(true);
  };

  const copyShareLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/collection/${id}`);
    toast.success("Share link copied!");
  };

  const toggleGame = (gameId) => {
    setForm((f) => ({
      ...f,
      game_ids: f.game_ids.includes(gameId) ? f.game_ids.filter((id) => id !== gameId) : [...f.game_ids, gameId],
    }));
  };

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Login to manage collections</div>;
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8" data-testid="collections-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize and share your favorite games</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setEditingId(null); setForm({ name: "", description: "", is_public: true, game_ids: [] }); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2" data-testid="create-collection-btn"><Plus className="w-4 h-4" /><span className="hidden sm:inline">New Collection</span></Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] glass-heavy border-border/50 max-h-[80vh] overflow-y-auto" data-testid="collection-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-['Outfit']">{editingId ? "Edit" : "Create"} Collection</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">Organize your games into a shareable collection</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Collection name" data-testid="collection-name-input" className="bg-secondary/30 border-border/50" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)"
                data-testid="collection-desc-input" className="w-full h-20 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
              <label className="flex items-center justify-between">
                <span className="text-sm">Public collection</span>
                <button onClick={() => setForm({ ...form, is_public: !form.is_public })} data-testid="collection-public-toggle"
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_public ? "bg-primary" : "bg-secondary"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_public ? "translate-x-5" : ""}`} />
                </button>
              </label>
              <div>
                <p className="text-sm font-medium mb-2">Select Games ({form.game_ids.length} selected)</p>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border/50 p-2">
                  {games.map((g) => (
                    <button key={g.id} onClick={() => toggleGame(g.id)} data-testid={`toggle-game-${g.app_id}`}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${form.game_ids.includes(g.id) ? "bg-primary/15 text-primary" : "hover:bg-secondary/50"}`}>
                      <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${g.app_id}/capsule_sm_120.jpg`} alt="" className="w-12 h-5 rounded object-cover" />
                      <span className="truncate flex-1">{g.name}</span>
                      {form.game_ids.includes(g.id) && <span className="text-primary text-xs">Selected</span>}
                    </button>
                  ))}
                  {games.length === 0 && <p className="text-center text-muted-foreground text-xs py-4">Add games to your library first</p>}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} data-testid="save-collection-btn" className="w-full rounded-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editingId ? "Update" : "Create"} Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <div key={c.id} onClick={() => navigate(`/collection/${c.id}`)} className="rounded-xl border border-border/50 bg-card/50 p-5 hover:bg-card/80 transition-colors cursor-pointer group" data-testid={`collection-card-${c.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{c.name}</h3>
                  {c.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                </div>
                <span className="text-muted-foreground ml-2">{c.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</span>
              </div>
              <div className="flex gap-1.5 mt-3 overflow-hidden h-16">
                {(c.games || []).slice(0, 5).map((g) => (
                  <img key={g.id} src={g.capsule_image || g.header_image} alt="" className="w-11 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ))}
                {(c.game_ids || []).length > 5 && <span className="text-xs text-muted-foreground self-center ml-1">+{c.game_ids.length - 5} more</span>}
              </div>
              <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => startEdit(c)} data-testid={`edit-collection-${c.id}`} className="gap-1.5"><Edit2 className="w-3.5 h-3.5" />Edit</Button>
                {c.is_public && <Button variant="ghost" size="sm" onClick={() => copyShareLink(c.id)} data-testid={`share-collection-${c.id}`} className="gap-1.5"><Share2 className="w-3.5 h-3.5" />Share</Button>}
                <div className="ml-auto" />
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} data-testid={`delete-collection-${c.id}`} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <FolderHeart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2 font-['Outfit']">No collections yet</h2>
          <p className="text-muted-foreground text-sm">Create a collection to organize and share your favorite games</p>
        </div>
      )}
    </div>
  );
}
