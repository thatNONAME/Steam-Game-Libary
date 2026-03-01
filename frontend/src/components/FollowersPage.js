import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Users, UserCheck, Loader2 } from "lucide-react";
import { RoleBadges } from "@/components/RoleBadge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FollowersPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ followers: [], following: [] });
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("followers");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, pRes] = await Promise.all([
          axios.get(`${API}/followers/${userId}`),
          axios.get(`${API}/profile/${userId}`),
        ]);
        setData(fRes.data);
        setProfile(pRes.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [userId]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const list = tab === "followers" ? data.followers : data.following;
  const displayName = profile?.display_name || profile?.username || "User";

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8" data-testid="followers-page">
      <div className="text-center mb-8">
        <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">{displayName}</h1>
        <p className="text-muted-foreground text-sm mt-1">Connections</p>
      </div>

      <div className="flex gap-1 border-b border-border/50 mb-6 justify-center">
        {["followers", "following"].map((t) => (
          <button key={t} onClick={() => setTab(t)} data-testid={`followers-tab-${t}`}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t} ({t === "followers" ? data.followers.length : data.following.length})
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="space-y-2" data-testid={`${tab}-list`}>
          {list.map((u) => {
            const avatar = u.custom_avatar || u.avatar_url;
            return (
              <button key={u.id} onClick={() => navigate(`/profile/${u.id}`)} data-testid={`follower-${u.id}`}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-colors text-left">
                {avatar ? (
                  <img src={avatar} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><UserCheck className="w-5 h-5 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{u.display_name || u.username}</p>
                    <RoleBadges roles={u.roles} />
                  </div>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No {tab} yet</p>
        </div>
      )}
    </div>
  );
}
