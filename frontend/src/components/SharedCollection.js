import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, User, Share2, Gamepad2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GameCard from "@/components/GameCard";
import { RoleBadges } from "@/components/RoleBadge";
import CommentSection from "@/components/CommentSection";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SharedCollection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("steam_token");
  let currentUserId = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.user_id;
    }
  } catch { /* ignore */ }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/collections/${id}/share`);
        setCollection(res.data);
      } catch { /* not found */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handleRemoveGame = async (gameId) => {
    if (!token) return;
    try {
      await axios.delete(`${API}/collections/${id}/games/${gameId}`, { headers: { Authorization: `Bearer ${token}` } });
      setCollection((prev) => ({
        ...prev,
        games: (prev.games || []).filter((g) => g.id !== gameId),
        game_ids: (prev.game_ids || []).filter((gid) => gid !== gameId),
      }));
      toast.success("Game removed from collection");
    } catch { toast.error("Failed to remove game"); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!collection) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
      <Gamepad2 className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-lg mb-4">Collection not found or is private</p>
      <Button variant="outline" onClick={() => navigate("/")} className="gap-2"><ArrowLeft className="w-4 h-4" />Go Home</Button>
    </div>
  );

  const owner = collection.owner;
  const games = collection.games || [];
  const isOwner = currentUserId && owner?.id === currentUserId;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8" data-testid="shared-collection">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-6" data-testid="back-btn"><ArrowLeft className="w-4 h-4" />Back</Button>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">{collection.name}</h1>
            {collection.description && <p className="text-muted-foreground mt-1 text-sm">{collection.description}</p>}
            {owner && (
              <button onClick={() => navigate(`/profile/${owner.id}`)} className="flex items-center gap-2 mt-2 text-sm text-primary hover:underline" data-testid="collection-owner-link">
                {owner.avatar_url ? <img src={owner.avatar_url} alt="" className="w-5 h-5 rounded-full" /> : <User className="w-4 h-4" />}
                <span>by {owner.display_name || owner.username}</span>
                <RoleBadges roles={owner.roles} />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={copyLink} className="rounded-full gap-2" data-testid="share-link-btn"><Share2 className="w-4 h-4" />Share</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{games.length} game{games.length !== 1 ? "s" : ""}</p>
      </div>

      {games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5" data-testid="collection-games-grid">
          {games.map((g, i) => (
            <div key={g.id} className="relative group">
              <GameCard game={g} index={i} />
              {isOwner && (
                <button onClick={() => handleRemoveGame(g.id)} data-testid={`remove-game-${g.app_id}`}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>This collection has no games yet</p>
        </div>
      )}

      <CommentSection targetType="collection" targetId={id} token={token} currentUser={null} />
    </div>
  );
}
