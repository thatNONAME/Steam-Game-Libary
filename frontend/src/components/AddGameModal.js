import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Link, Loader2, Gamepad2, ExternalLink } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AddGameModal({ token, onGameAdded, isGuest, localGameCount }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const maxGuest = 10;
  const guestLimitReached = isGuest && localGameCount >= maxGuest;

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(`${API}/steam/search`, {
        params: { term: searchQuery.trim() },
      });
      setSearchResults(res.data?.items || []);
      if (!res.data?.items?.length) {
        toast.info("No games found");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const addGameById = async (appId, name) => {
    if (guestLimitReached) {
      toast.error("Login with Steam to add more than 10 games");
      return;
    }
    setAdding(appId);
    try {
      if (isGuest) {
        // Fetch details from Steam for local storage
        const res = await axios.get(`${API}/steam/app/${appId}`);
        const data = res.data;
        const game = {
          id: `local_${appId}`,
          app_id: appId,
          name: data.name || name,
          header_image: data.header_image || "",
          capsule_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
          screenshots: (data.screenshots || []).slice(0, 6).map((s) => s.path_full),
          categories: (data.categories || []).map((c) => c.description),
          genres: (data.genres || []).map((g) => g.description),
          steam_url: `https://store.steampowered.com/app/${appId}`,
          release_date: data.release_date?.date || "",
          short_description: data.short_description || "",
          developers: data.developers || [],
          publishers: data.publishers || [],
          is_from_wishlist: false,
          added_at: new Date().toISOString(),
        };
        onGameAdded(game);
        toast.success(`${game.name} added to library`);
      } else {
        const res = await axios.post(
          `${API}/games`,
          { app_id: appId, name: name || "" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onGameAdded(res.data);
        toast.success(`${res.data.name} added to library`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add game";
      toast.error(msg);
    } finally {
      setAdding(null);
    }
  };

  const addGameByUrl = async () => {
    if (!urlInput.trim()) return;
    if (guestLimitReached) {
      toast.error("Login with Steam to add more than 10 games");
      return;
    }
    const match = urlInput.match(/\/app\/(\d+)/);
    if (!match) {
      toast.error("Invalid Steam URL");
      return;
    }
    await addGameById(parseInt(match[1]), "");
    setUrlInput("");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const text = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
    if (!text) return;
    const match = text.match(/\/app\/(\d+)/);
    if (match) {
      await addGameById(parseInt(match[1]), "");
    } else {
      toast.error("Not a valid Steam game URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid="add-game-btn"
          className="rounded-full gap-2 px-5"
          disabled={guestLimitReached}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Game</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] glass-heavy border-border/50 p-0 gap-0"
        data-testid="add-game-modal"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold font-['Outfit']">
            Add a Steam Game
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Search, paste a URL, or drag a Steam link to add games
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border/50 px-6">
          <button
            onClick={() => setTab("search")}
            data-testid="add-tab-search"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "search"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="w-4 h-4 inline mr-1.5" />
            Search
          </button>
          <button
            onClick={() => setTab("url")}
            data-testid="add-tab-url"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "url"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link className="w-4 h-4 inline mr-1.5" />
            Paste URL
          </button>
        </div>

        <div className="p-6">
          {tab === "search" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search Steam games..."
                  data-testid="search-steam-input"
                  className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  data-testid="search-steam-btn"
                  className="h-12 px-6"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto space-y-2" data-testid="search-results">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-colors"
                    data-testid={`search-result-${item.id}`}
                  >
                    <img
                      src={item.tiny_image || `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/capsule_sm_120.jpg`}
                      alt={item.name}
                      className="w-16 h-8 object-cover rounded"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.price && (
                        <p className="text-xs text-muted-foreground">
                          {item.price.final === 0 ? "Free" : `$${(item.price.final / 100).toFixed(2)}`}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addGameById(item.id, item.name)}
                      disabled={adding === item.id}
                      data-testid={`add-result-${item.id}`}
                      className="shrink-0 rounded-full"
                    >
                      {adding === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
                {searchResults.length === 0 && !searching && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Search for a Steam game to add</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "url" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGameByUrl()}
                  placeholder="https://store.steampowered.com/app/730/..."
                  data-testid="url-input"
                  className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50"
                />
                <Button
                  onClick={addGameByUrl}
                  disabled={!urlInput.trim() || adding}
                  data-testid="add-url-btn"
                  className="h-12 px-6"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                data-testid="drop-zone"
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver
                    ? "drop-zone-active"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <ExternalLink className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Drag a Steam game link here
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  or paste the URL above
                </p>
              </div>
            </div>
          )}

          {isGuest && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {localGameCount}/{maxGuest} games added. Login with Steam for unlimited games.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
