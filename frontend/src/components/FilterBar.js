import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation",
  "Sports", "Racing", "Puzzle", "Horror", "Shooter",
  "Platformer", "Fighting", "Survival", "Open World", "Indie",
  "Multiplayer", "Co-op", "MMO", "Story Rich", "Sandbox",
  "Roguelike", "Tower Defense", "City Builder", "Card Game", "Visual Novel",
  "Battle Royale", "Stealth", "Rhythm", "Casual", "Arcade"
];

const CATEGORY_COLORS = {
  Action: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25",
  Adventure: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
  RPG: "bg-purple-500/15 text-purple-400 border-purple-500/25 hover:bg-purple-500/25",
  Strategy: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25",
  Simulation: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/25",
  Sports: "bg-green-500/15 text-green-400 border-green-500/25 hover:bg-green-500/25",
  Racing: "bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-orange-500/25",
  Puzzle: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/25",
  Horror: "bg-rose-500/15 text-rose-400 border-rose-500/25 hover:bg-rose-500/25",
  Shooter: "bg-red-600/15 text-red-300 border-red-600/25 hover:bg-red-600/25",
  Platformer: "bg-sky-500/15 text-sky-400 border-sky-500/25 hover:bg-sky-500/25",
  Fighting: "bg-orange-600/15 text-orange-300 border-orange-600/25 hover:bg-orange-600/25",
  Survival: "bg-lime-500/15 text-lime-400 border-lime-500/25 hover:bg-lime-500/25",
  "Open World": "bg-teal-500/15 text-teal-400 border-teal-500/25 hover:bg-teal-500/25",
  Indie: "bg-pink-500/15 text-pink-400 border-pink-500/25 hover:bg-pink-500/25",
  Multiplayer: "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25",
  "Co-op": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25 hover:bg-indigo-500/25",
  MMO: "bg-violet-500/15 text-violet-400 border-violet-500/25 hover:bg-violet-500/25",
  "Story Rich": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/25 hover:bg-fuchsia-500/25",
  Sandbox: "bg-amber-600/15 text-amber-300 border-amber-600/25 hover:bg-amber-600/25",
  Roguelike: "bg-slate-400/15 text-slate-300 border-slate-400/25 hover:bg-slate-400/25",
  "Tower Defense": "bg-stone-400/15 text-stone-300 border-stone-400/25 hover:bg-stone-400/25",
  "City Builder": "bg-emerald-600/15 text-emerald-300 border-emerald-600/25 hover:bg-emerald-600/25",
  "Card Game": "bg-yellow-600/15 text-yellow-300 border-yellow-600/25 hover:bg-yellow-600/25",
  "Visual Novel": "bg-pink-600/15 text-pink-300 border-pink-600/25 hover:bg-pink-600/25",
  "Battle Royale": "bg-red-700/15 text-red-300 border-red-700/25 hover:bg-red-700/25",
  Stealth: "bg-gray-500/15 text-gray-300 border-gray-500/25 hover:bg-gray-500/25",
  Rhythm: "bg-violet-600/15 text-violet-300 border-violet-600/25 hover:bg-violet-600/25",
  Casual: "bg-sky-400/15 text-sky-300 border-sky-400/25 hover:bg-sky-400/25",
  Arcade: "bg-cyan-600/15 text-cyan-300 border-cyan-600/25 hover:bg-cyan-600/25",
};

export { CATEGORIES, CATEGORY_COLORS };

export default function FilterBar({ selected, onSelect }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex items-center gap-2" data-testid="filter-bar">
      <button
        onClick={() => scroll(-1)}
        className="hidden md:flex shrink-0 w-8 h-8 items-center justify-center rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
        data-testid="filter-scroll-left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1"
      >
        <button
          onClick={() => onSelect(null)}
          data-testid="filter-all"
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap active:scale-95 ${
            !selected
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          All Games
        </button>

        {CATEGORIES.map((cat) => {
          const isActive = selected === cat;
          const colorClass = CATEGORY_COLORS[cat] || "bg-secondary/30 text-muted-foreground border-border/50";
          return (
            <button
              key={cat}
              onClick={() => onSelect(isActive ? null : cat)}
              data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap active:scale-95 ${
                isActive
                  ? "ring-2 ring-primary/50 font-semibold " + colorClass
                  : colorClass
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll(1)}
        className="hidden md:flex shrink-0 w-8 h-8 items-center justify-center rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
        data-testid="filter-scroll-right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
