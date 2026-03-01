import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Gamepad2, Loader2, UserCheck } from "lucide-react";
import { RoleBadges } from "@/components/RoleBadge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UserSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`${API}/users/search`, { params: { q: query.trim() } });
      setResults(res.data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8" data-testid="user-search-page">
      <div className="text-center mb-8">
        <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Find Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Discover other gamers and their collections</p>
      </div>

      <div className="flex gap-2 max-w-md mx-auto mb-8">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by username..." data-testid="user-search-input"
          className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-full pl-4" />
        <Button onClick={handleSearch} disabled={loading || !query.trim()} data-testid="user-search-btn" className="h-12 px-6 rounded-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-3" data-testid="user-search-results">
          {results.map((u) => (
            <button key={u.id} onClick={() => navigate(`/profile/${u.id}`)} data-testid={`user-result-${u.id}`}
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-colors text-left">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{u.display_name || u.username}</p>
                  <RoleBadges roles={u.roles} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3" />{u.game_count} games</span>
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{u.follower_count || 0} followers</span>
                  {u.is_library_public ? <span className="text-primary">Public Library</span> : <span>Private</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : searched && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No users found matching "{query}"</p>
        </div>
      ) : !searched ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Search for users to explore their libraries</p>
        </div>
      ) : null}
    </div>
  );
}
