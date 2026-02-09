import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Leaf, Palette, Sparkles, Star } from "lucide-react";

const THEMES = [
  { id: "dark-blue", name: "Deep Dive", icon: Moon, desc: "Dark Blue" },
  { id: "chrome", name: "Liquid Metal", icon: Sun, desc: "Chrome Light" },
  { id: "nature", name: "Zen Garden", icon: Leaf, desc: "Nature" },
  { id: "glass", name: "Frost Glass", icon: Sparkles, desc: "Futuristic Glass" },
  { id: "space", name: "Deep Space", icon: Star, desc: "Starfield" },
];

export default function ThemeSwitcher({ theme, setTheme, mobile = false }) {
  if (mobile) {
    return (
      <div className="flex flex-col gap-1">
        {THEMES.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTheme(t.id)} data-testid={`theme-${t.id}-mobile`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${theme === t.id ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
              <Icon className="w-4 h-4" /><span>{t.name}</span><span className="text-xs text-muted-foreground ml-auto">{t.desc}</span>
            </button>
          );
        })}
      </div>
    );
  }
  const current = THEMES.find((t) => t.id === theme);
  const CurrentIcon = current?.icon || Palette;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="theme-toggle" className="rounded-full w-9 h-9"><CurrentIcon className="w-4 h-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 glass-heavy border-border/50">
        {THEMES.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)} data-testid={`theme-${t.id}`}
              className={`gap-3 cursor-pointer ${theme === t.id ? "bg-primary/10 text-primary" : ""}`}>
              <Icon className="w-4 h-4" />
              <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.desc}</p></div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
