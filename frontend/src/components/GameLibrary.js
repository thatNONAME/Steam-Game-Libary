import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, RefreshCw, Loader2, Gamepad2, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FilterBar from "@/components/FilterBar";
import GameCard from "@/components/GameCard";
import AddGameModal from "@/components/AddGameModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOCAL_STORAGE_KEY = "nebula_local_games";

export default function GameLibrary({ user, token }) {
  const [games, setGames] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const isGuest = !user;

  const loadLocalGames = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveLocalGames = (games) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
  };

  const fetchGames = useCallback(async () => {
    if (isGuest) {
      setGames(loadLocalGames());
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGames(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        toast.error("Failed to load games");
      }
    } finally {
      setLoading(false);
    }
  }, [isGuest, token, loadLocalGames]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleGameAdded = (game) => {
    if (isGuest) {
      const updated = [game, ...loadLocalGames()];
      saveLocalGames(updated);
      setGames(updated);
    } else {
      setGames((prev) => [game, ...prev]);
    }
  };

  const handleRemoveGame = async (game) => {
    if (isGuest) {
      const updated = loadLocalGames().filter((g) => g.id !== game.id);
      saveLocalGames(updated);
      setGames(updated);
      toast.success(`${game.name} removed`);
    } else {
      try {
        await axios.delete(`${API}/games/${game.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGames((prev) => prev.filter((g) => g.id !== game.id));
        toast.success(`${game.name} removed`);
      } catch {
        toast.error("Failed to remove game");
      }
    }
  };

  const handleSyncWishlist = async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const res = await axios.post(`${API}/steam/sync-wishlist`, null, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000,
      });
      toast.success(res.data.message);
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.error || "Wishlist sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Filter games
  const filteredGames = games.filter((game) => {
    const matchesCategory = !selectedCategory || (game.categories && game.categories.includes(selectedCategory));
    const matchesSearch =
      !searchQuery.trim() ||
      game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8" data-testid="game-library">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-['Outfit']" data-testid="library-title">
              {user ? `${user.username}'s Library` : "Game Library"}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
              {games.length} game{games.length !== 1 ? "s" : ""} in collection
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="outline"
                onClick={handleSyncWishlist}
                disabled={syncing}
                data-testid="sync-wishlist-btn"
                className="rounded-full gap-2"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Sync Wishlist</span>
              </Button>
            )}
            <AddGameModal
              token={token}
              onGameAdded={handleGameAdded}
              isGuest={isGuest}
              localGameCount={isGuest ? games.length : 0}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            data-testid="library-search"
            className="pl-10 h-11 bg-secondary/30 border-border/50 focus:border-primary/50 rounded-full"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8">
        <FilterBar selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : filteredGames.length > 0 ? (
        /* Game Grid */
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          data-testid="game-grid"
        >
          {filteredGames.map((game, i) => (
            <GameCard
              key={game.id || game.app_id}
              game={game}
              index={i}
              onRemove={handleRemoveGame}
              isGuest={isGuest}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
          {games.length === 0 ? (
            <>
              <Gamepad2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2 font-['Outfit']">
                Your library is empty
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                {isGuest
                  ? "Search and add Steam games to start building your collection. Login with Steam for unlimited games and wishlist sync."
                  : "Search for games or sync your Steam wishlist to get started."}
              </p>
              {isGuest && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <LogIn className="w-4 h-4" />
                  <span>Login with Steam for the full experience</span>
                </div>
              )}
            </>
          ) : (
            <>
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2 font-['Outfit']">
                No matches found
              </h2>
              <p className="text-muted-foreground text-sm">
                Try a different search or category filter
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
