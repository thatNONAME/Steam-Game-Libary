import { useState, useEffect } from "react";
import axios from "axios";
import { ScrollText, Shield, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/rules`).then((res) => setRules(res.data.rules || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8" data-testid="rules-page">
      <div className="text-center mb-10">
        <ScrollText className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Community Rules</h1>
        <p className="text-muted-foreground text-sm mt-1">Please follow these rules to keep the community safe</p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/80">Violating these rules may result in a ban. Banned users cannot post comments and their profiles become hidden from public view. If you believe you were banned unfairly, you can submit an appeal via the Support page.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4" data-testid="rules-list">
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors" data-testid={`rule-${i}`}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm shrink-0">{i + 1}</div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />{rule.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
