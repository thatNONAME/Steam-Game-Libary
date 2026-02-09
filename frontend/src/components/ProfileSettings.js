import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, User, Image, Shield, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfileSettings({ user, token, onUpdate }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: "", bio: "", custom_avatar: "", banner_image: "",
    is_library_public: true, is_collections_public: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    setForm({
      display_name: user.display_name || user.username || "",
      bio: user.bio || "",
      custom_avatar: user.custom_avatar || "",
      banner_image: user.banner_image || "",
      is_library_public: user.is_library_public !== false,
      is_collections_public: user.is_collections_public !== false,
    });
  }, [user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Profile updated!");
      if (onUpdate) onUpdate();
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8" data-testid="profile-settings">
      <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] mb-8">Profile Settings</h1>

      <div className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-primary" />Personal Info</h2>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Display Name</label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              data-testid="settings-display-name" className="bg-secondary/30 border-border/50" placeholder="Your display name" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              data-testid="settings-bio" className="w-full h-24 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground" placeholder="Tell us about yourself..." />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Image className="w-5 h-5 text-primary" />Appearance</h2>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Custom Avatar URL</label>
            <Input value={form.custom_avatar} onChange={(e) => setForm({ ...form, custom_avatar: e.target.value })}
              data-testid="settings-avatar" className="bg-secondary/30 border-border/50" placeholder="https://example.com/avatar.jpg" />
            {(form.custom_avatar || user.avatar_url) && (
              <img src={form.custom_avatar || user.avatar_url} alt="Preview" className="w-16 h-16 rounded-full mt-2 object-cover border border-border" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Banner Image URL</label>
            <Input value={form.banner_image} onChange={(e) => setForm({ ...form, banner_image: e.target.value })}
              data-testid="settings-banner" className="bg-secondary/30 border-border/50" placeholder="https://example.com/banner.jpg" />
            {form.banner_image && (
              <img src={form.banner_image} alt="Preview" className="w-full h-24 rounded-lg mt-2 object-cover border border-border" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Privacy</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div><p className="text-sm font-medium">Public Library</p><p className="text-xs text-muted-foreground">Others can see your game collection</p></div>
            <button onClick={() => setForm({ ...form, is_library_public: !form.is_library_public })} data-testid="toggle-library-public"
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_library_public ? "bg-primary" : "bg-secondary"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_library_public ? "translate-x-5" : ""}`} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div><p className="text-sm font-medium">Public Collections</p><p className="text-xs text-muted-foreground">Others can see your collections</p></div>
            <button onClick={() => setForm({ ...form, is_collections_public: !form.is_collections_public })} data-testid="toggle-collections-public"
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_collections_public ? "bg-primary" : "bg-secondary"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_collections_public ? "translate-x-5" : ""}`} />
            </button>
          </label>
        </div>

        <Button onClick={handleSave} disabled={saving} data-testid="save-settings-btn" className="w-full rounded-full h-12 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
        </Button>
      </div>
    </div>
  );
}
