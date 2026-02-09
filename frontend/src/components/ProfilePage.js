import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { User, Gamepad2, FolderHeart, Calendar, Lock } from "lucide-react";
import GameCard from "@/components/GameCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("games");

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes] = await Promise.all([axios.get(`${API}/profile/${userId}`)]);
        setProfile(pRes.data);
        if (pRes.data.is_library_public) {
          const gRes = await axios.get(`${API}/profile/${userId}/games`);
          setGames(gRes.data);
        }
        if (pRes.data.is_collections_public) {
          const cRes = await axios.get(`${API}/profile/${userId}/collections`);
          setCollections(cRes.data);
        }
      } catch { /* profile not found */ }
      finally { setLoading(false); }
    };
    load();
  }, [userId]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Profile not found</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8" data-testid="profile-page">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-40 md:h-56" style={{
        background: profile.banner_image ? `url(${profile.banner_image}) center/cover` : "linear-gradient(135deg, hsl(var(--primary)/0.3), hsl(var(--accent)/0.3))"
      }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex items-end gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-background overflow-hidden bg-secondary">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-muted-foreground" />}
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold font-['Outfit'] text-white drop-shadow-lg">{profile.display_name || profile.username}</h1>
            {profile.bio && <p className="text-sm text-white/70 mt-1 max-w-md line-clamp-2">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
              <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3" />{games.length} games</span>
              <span className="flex items-center gap-1"><FolderHeart className="w-3 h-3" />{collections.length} collections</span>
              {profile.created_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {new Date(profile.created_at).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50 mb-6">
        <button onClick={() => setTab("games")} data-testid="profile-tab-games"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "games" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Games ({games.length})
        </button>
        <button onClick={() => setTab("collections")} data-testid="profile-tab-collections"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "collections" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Collections ({collections.length})
        </button>
      </div>

      {tab === "games" && (
        profile.is_library_public ? (
          games.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5" data-testid="profile-games-grid">
              {games.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
            </div>
          ) : <p className="text-center text-muted-foreground py-12">No games in library yet</p>
        ) : <div className="flex flex-col items-center py-12 text-muted-foreground"><Lock className="w-8 h-8 mb-2" /><p>Library is private</p></div>
      )}

      {tab === "collections" && (
        profile.is_collections_public ? (
          collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((c) => (
                <a key={c.id} href={`/collection/${c.id}`} className="block rounded-xl border border-border/50 bg-card/50 p-4 hover:bg-card transition-colors" data-testid={`profile-collection-${c.id}`}>
                  <h3 className="font-semibold text-base">{c.name}</h3>
                  {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex gap-1 mt-3 overflow-hidden">
                    {(c.games || []).slice(0, 4).map((g) => (
                      <img key={g.id} src={g.capsule_image || g.header_image} alt="" className="w-10 h-14 rounded object-cover" />
                    ))}
                    {(c.games || []).length > 4 && <span className="text-xs text-muted-foreground self-center ml-1">+{c.games.length - 4}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{(c.games || []).length} games</p>
                </a>
              ))}
            </div>
          ) : <p className="text-center text-muted-foreground py-12">No public collections</p>
        ) : <div className="flex flex-col items-center py-12 text-muted-foreground"><Lock className="w-8 h-8 mb-2" /><p>Collections are private</p></div>
      )}
    </div>
  );
}
