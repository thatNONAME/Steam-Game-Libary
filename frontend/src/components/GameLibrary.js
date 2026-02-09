import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, RefreshCw, Loader2, Gamepad2, LogIn, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FilterBar from "@/components/FilterBar";
import GameCard from "@/components/GameCard";
import AddGameModal from "@/components/AddGameModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOCAL_KEY = "nebula_local_games";

const SORT_OPTIONS = [
  { value: "added", label: "Recently Added" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "reviews_desc", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "release_desc", label: "Newest Release" },
  { value: "release_asc", label: "Oldest Release" },
];

export default function GameLibrary({ user, token }) {
  const [games, setGames] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("added");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const isGuest = !user;

  const loadLocal = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
  }, []);

  const fetchGames = useCallback(async () => {
    if (isGuest) { setGames(loadLocal()); setLoading(false); return; }
    try {
      const params = {};
      if (sortBy !== "added") params.sort_by = sortBy;
      const res = await axios.get(`${API}/games`, { headers: { Authorization: `Bearer ${token}` }, params });
      setGames(res.data);
    } catch (err) {
      if (err.response?.status !== 401) toast.error("Failed to load games");
    } finally { setLoading(false); }
  }, [isGuest, token, loadLocal, sortBy]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const handleGameAdded = (game) => {
    if (isGuest) {
      const updated = [game, ...loadLocal()];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      setGames(updated);
    } else { setGames((prev) => [game, ...prev]); }
  };

  const handleRemoveGame = async (game) => {
    if (isGuest) {
      const updated = loadLocal().filter((g) => g.id !== game.id);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      setGames(updated);
      toast.success(`${game.name} removed`);
    } else {
      try {
        await axios.delete(`${API}/games/${game.id}`, { headers: { Authorization: `Bearer ${token}` } });
        setGames((prev) => prev.filter((g) => g.id !== game.id));
        toast.success(`${game.name} removed`);
      } catch { toast.error("Failed to remove game"); }
    }
  };

  const handleSyncWishlist = async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const res = await axios.post(`${API}/steam/sync-wishlist`, null, { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 });
      toast.success(res.data.message);
      fetchGames();
    } catch (err) { toast.error(err.response?.data?.error || "Wishlist sync failed"); }
    finally { setSyncing(false); }
  };

  const filteredGames = games.filter((g) => {
    const matchCat = !selectedCategory || g.categories?.includes(selectedCategory);
    const matchSearch = !searchQuery.trim() || g.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Client-side sort for local games
  const sortedGames = isGuest ? [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case "name_asc": return (a.name || "").localeCompare(b.name || "");
      case "name_desc": return (b.name || "").localeCompare(a.name || "");
      case "reviews_desc": return (b.total_reviews || 0) - (a.total_reviews || 0);
      case "price_asc": return (a.price_cents || 0) - (b.price_cents || 0);
      case "price_desc": return (b.price_cents || 0) - (a.price_cents || 0);
      default: return 0;
    }
  }) : filteredGames;

  const currentSort = SORT_OPTIONS.find((s) => s.value === sortBy);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8" data-testid="game-library">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-['Outfit']" data-testid="library-title">
              {user ? `${user.display_name || user.username}'s Library` : "Game Library"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{games.length} game{games.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <Button variant="outline" onClick={handleSyncWishlist} disabled={syncing} data-testid="sync-wishlist-btn" className="rounded-full gap-2">
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden sm:inline">Sync Wishlist</span>
              </Button>
            )}
            <AddGameModal token={token} onGameAdded={handleGameAdded} isGuest={isGuest} localGameCount={isGuest ? games.length : 0} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search your library..." data-testid="library-search"
              className="pl-10 h-11 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-full" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 shrink-0" data-testid="sort-btn">
                <ArrowUpDown className="w-4 h-4" /><span className="text-sm">{currentSort?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => setSortBy(opt.value)} data-testid={`sort-${opt.value}`}
                  className={sortBy === opt.value ? "bg-primary/10 text-primary" : ""}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mb-8"><FilterBar selected={selectedCategory} onSelect={setSelectedCategory} /></div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="aspect-[2/3] rounded-xl bg-secondary/30 animate-pulse" />))}
        </div>
      ) : sortedGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5" data-testid="game-grid">
          {sortedGames.map((game, i) => (<GameCard key={game.id || game.app_id} game={game} index={i} onRemove={handleRemoveGame} />))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
          {games.length === 0 ? (<>
            <Gamepad2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2 font-['Outfit']">Your library is empty</h2>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              {isGuest ? "Search and add Steam games. Login with Steam for unlimited games and wishlist sync." : "Search for games or sync your Steam wishlist to get started."}
            </p>
            {isGuest && <div className="flex items-center gap-2 text-sm text-primary"><LogIn className="w-4 h-4" /><span>Login with Steam for the full experience</span></div>}
          </>) : (<>
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2 font-['Outfit']">No matches found</h2>
            <p className="text-muted-foreground text-sm">Try a different search or category</p>
          </>)}
        </div>
      )}
    </div>
  );
}
