import { useState } from "react";
import { ExternalLink, Trash2, Gamepad2 } from "lucide-react";
import { CATEGORY_COLORS } from "@/components/FilterBar";
import { motion } from "framer-motion";

export default function GameCard({ game, onRemove, index = 0, isGuest = false }) {
  const [imgError, setImgError] = useState(false);
  const [headerError, setHeaderError] = useState(false);

  const coverSrc = imgError
    ? (headerError ? null : game.header_image)
    : game.capsule_image || `https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/library_600x900.jpg`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group relative overflow-hidden rounded-xl game-card-glow cursor-pointer"
      data-testid={`game-card-${game.app_id}`}
    >
      <a
        href={game.steam_url || `https://store.steampowered.com/app/${game.app_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[2/3] relative"
        data-testid={`game-link-${game.app_id}`}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              if (!imgError) {
                setImgError(true);
              } else {
                setHeaderError(true);
              }
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full game-cover-fallback">
            <Gamepad2 className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="font-bold text-white text-base md:text-lg leading-tight line-clamp-2">
              {game.name}
            </h3>
            {game.release_date && (
              <p className="text-xs text-white/60 mt-1">{game.release_date}</p>
            )}
            {game.categories && game.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                {game.categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      CATEGORY_COLORS[cat] || "bg-secondary/50 text-foreground border-border/50"
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2.5 text-xs text-white/70">
              <ExternalLink className="w-3 h-3" />
              <span>View on Steam</span>
            </div>
          </div>
        </div>
      </a>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(game);
          }}
          data-testid={`remove-game-${game.app_id}`}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:border-destructive"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      )}

      {/* Bottom info (always visible) */}
      <div className="p-3 bg-card/80">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1" data-testid={`game-name-${game.app_id}`}>
          {game.name}
        </h3>
        {game.genres && game.genres.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {game.genres.slice(0, 3).join(" / ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}
