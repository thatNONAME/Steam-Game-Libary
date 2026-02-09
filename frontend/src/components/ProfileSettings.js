import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, User, Image, Shield, Loader2, Upload, Camera } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfileSettings({ user, token, onUpdate }) {
  const navigate = useNavigate();
  const avatarRef = useRef(null);
  const bannerRef = useRef(null);
  const [form, setForm] = useState({
    display_name: "", bio: "", custom_avatar: "", banner_image: "",
    is_library_public: true, is_collections_public: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

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

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("File too large (max 5MB)"); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { toast.error("Only JPEG, PNG, WebP, GIF allowed"); return; }

    setUploading(field);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API}/upload/image`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = `${BACKEND_URL}${res.data.url}`;
      setForm((f) => ({ ...f, [field]: imageUrl }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally { setUploading(null); }
  };

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
              data-testid="settings-display-name" className="bg-secondary/30 border-border/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              data-testid="settings-bio" className="w-full h-24 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground" placeholder="Tell us about yourself..." />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Image className="w-5 h-5 text-primary" />Appearance</h2>

          {/* Avatar */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-secondary">
                  {(form.custom_avatar || user.avatar_url) ? (
                    <img src={form.custom_avatar || user.avatar_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                </div>
                <button onClick={() => avatarRef.current?.click()} data-testid="upload-avatar-btn"
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                </button>
                {uploading === 'custom_avatar' && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'custom_avatar')} />
                <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()} className="gap-2" data-testid="choose-avatar-btn">
                  <Upload className="w-3.5 h-3.5" />Choose from device
                </Button>
                <Input value={form.custom_avatar} onChange={(e) => setForm({ ...form, custom_avatar: e.target.value })}
                  data-testid="settings-avatar-url" className="bg-secondary/30 border-border/50 text-xs" placeholder="Or paste image URL..." />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Banner Image</label>
            <div className="relative group rounded-xl overflow-hidden border border-border bg-secondary h-28 cursor-pointer" onClick={() => bannerRef.current?.click()}>
              {form.banner_image ? (
                <img src={form.banner_image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Image className="w-6 h-6" /></div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white text-sm"><Upload className="w-4 h-4" />Upload Banner</div>
              </div>
              {uploading === 'banner_image' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={(e) => handleFileUpload(e.target.files?.[0], 'banner_image')} data-testid="upload-banner-input" />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => bannerRef.current?.click()} className="gap-2" data-testid="choose-banner-btn">
                <Upload className="w-3.5 h-3.5" />Choose from device
              </Button>
            </div>
            <Input value={form.banner_image} onChange={(e) => setForm({ ...form, banner_image: e.target.value })}
              data-testid="settings-banner-url" className="bg-secondary/30 border-border/50 text-xs mt-2" placeholder="Or paste banner URL..." />
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
