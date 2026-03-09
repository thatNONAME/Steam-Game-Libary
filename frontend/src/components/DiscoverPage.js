import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Compass, Users, FolderHeart, Gamepad2, Loader2, UserCheck, TrendingUp } from "lucide-react";
import { RoleBadges } from "@/components/RoleBadge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("trending");
  const [trending, setTrending] = useState([]);
  const [collections, setCollections] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === "trending") {
          const res = await axios.get(`${API}/discover/trending`);
          setTrending(res.data);
        } else if (tab === "collections") {
          const res = await axios.get(`${API}/discover/collections`);
          setCollections(res.data);
        } else {
          const res = await axios.get(`${API}/discover/users`);
          setUsers(res.data);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [tab]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8" data-testid="discover-page">
      <div className="text-center mb-8">
        <Compass className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Discover</h1>
        <p className="text-muted-foreground text-sm mt-1">Explore trending games, public collections and users</p>
      </div>

      <div className="flex gap-1 border-b border-border/50 mb-8 justify-center">
        {[
          { key: "trending", label: "Trending Games", icon: TrendingUp },
          { key: "collections", label: "Collections", icon: FolderHeart },
          { key: "users", label: "Users", icon: Users },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`discover-tab-${t.key}`}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : tab === "trending" ? (
        trending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="trending-grid">
            {trending.map((g) => (
              <a key={g.app_id} href={`https://store.steampowered.com/app/${g.app_id}`} target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:bg-card/80 transition-colors group" data-testid={`trending-game-${g.app_id}`}>
                <div className="relative overflow-hidden">
                  <img src={g.header_image} alt={g.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{g.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.short_description}</p>
                  <p className="text-xs font-medium text-primary mt-2">{g.price || 'Free'}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Could not load trending games</p>
          </div>
        )
      ) : tab === "collections" ? (
        collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="discover-collections-grid">
            {collections.map((c) => {
              const owner = c.owner || {};
              const ownerAvatar = owner.custom_avatar || owner.avatar_url;
              return (
                <div key={c.id} onClick={() => navigate(`/collection/${c.id}`)}
                  className="rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:bg-card/80 transition-colors cursor-pointer group"
                  data-testid={`discover-collection-${c.id}`}>
                  {c.picture_url && <img src={c.picture_url} alt="" className="w-full h-32 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {ownerAvatar ? <img src={ownerAvatar} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"><UserCheck className="w-3 h-3 text-muted-foreground" /></div>}
                      <span className="text-xs text-muted-foreground truncate">{owner.display_name || owner.username || "Unknown"}</span>
                      <RoleBadges roles={owner.roles} />
                    </div>
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{c.name}</h3>
                    {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    <div className="flex gap-1.5 mt-3 overflow-hidden h-16">
                      {(c.games || []).slice(0, 5).map((g) => (
                        <img key={g.id} src={g.capsule_image || g.header_image} alt="" className="w-11 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{(c.games || []).length} games</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <FolderHeart className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No public collections yet</p>
          </div>
        )
      ) : (
        users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="discover-users-grid">
            {users.map((u) => (
              <button key={u.id} onClick={() => navigate(`/profile/${u.id}`)} data-testid={`discover-user-${u.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-colors text-left">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-full" /> : <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><UserCheck className="w-5 h-5 text-muted-foreground" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{u.display_name || u.username}</p>
                    <RoleBadges roles={u.roles} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3" />{u.game_count} games</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{u.follower_count} followers</span>
                  </div>
                  {u.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{u.bio}</p>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No public users yet</p>
          </div>
        )
      )}
    </div>
  );
}
