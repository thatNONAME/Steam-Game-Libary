import { useState } from "react";
import { ExternalLink, Trash2, Gamepad2 } from "lucide-react";
import { CATEGORY_COLORS } from "@/components/FilterBar";
import { motion } from "framer-motion";

export default function GameCard({ game, onRemove, index = 0 }) {
  const [imgSrc, setImgSrc] = useState(
    game.capsule_image || `https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/library_600x900.jpg`
  );
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setImgSrc(game.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.6), duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl game-card-glow"
      data-testid={`game-card-${game.app_id}`}
    >
      <a href={game.steam_url || `https://store.steampowered.com/app/${game.app_id}`} target="_blank" rel="noopener noreferrer"
        className="block aspect-[2/3] relative bg-card" data-testid={`game-link-${game.app_id}`}>
        {imgSrc && !failed ? (
          <img src={imgSrc} alt={game.name} className="w-full h-full object-cover" onError={handleError} loading="lazy" />
        ) : failed && imgSrc ? (
          <img src={imgSrc} alt={game.name} className="w-full h-full object-cover" loading="lazy"
            onError={() => setImgSrc(null)} />
        ) : (
          <div className="w-full h-full game-cover-fallback"><Gamepad2 className="w-12 h-12 text-muted-foreground/50" /></div>
        )}
        {/* Hover overlay - no transform on image to prevent glitch */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 className="font-bold text-white text-sm md:text-base leading-tight line-clamp-2">{game.name}</h3>
          {game.release_date && <p className="text-[10px] text-white/60 mt-1">{game.release_date}</p>}
          {game.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {game.categories.slice(0, 3).map((cat) => (
                <span key={cat} className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${CATEGORY_COLORS[cat] || "bg-secondary/50 text-foreground border-border/50"}`}>{cat}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/70"><ExternalLink className="w-3 h-3" /><span>View on Steam</span></div>
        </div>
      </a>
      {onRemove && (
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(game); }} data-testid={`remove-game-${game.app_id}`}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive">
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      )}
      <div className="p-2.5 bg-card/80">
        <h3 className="font-semibold text-xs leading-tight line-clamp-1" data-testid={`game-name-${game.app_id}`}>{game.name}</h3>
        {game.genres?.length > 0 && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{game.genres.slice(0, 2).join(" / ")}</p>}
      </div>
    </motion.div>
  );
}
