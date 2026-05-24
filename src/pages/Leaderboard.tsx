import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

type Row = { user_id: string; name: string; days_tracked: number; avg_score: number };

const MAX_MARKS = 240;

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc("get_devotee_leaderboard", { _limit: 50 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arr: Row[] = Array.isArray(data) ? data.map((r: any) => ({
        user_id: r.user_id,
        name: r.name || "Devotee",
        days_tracked: Number(r.days_tracked) || 0,
        avg_score: Number(r.avg_score) || 0,
      })) : [];
      setRows(arr);
      setLoading(false);
    })();
  }, []);

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (i === 1) return <Medal className="h-6 w-6 text-slate-400" />;
    if (i === 2) return <Award className="h-6 w-6 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground w-6 text-center">{i + 1}</span>;
  };

  const pct = (avg: number) => Math.min(100, Math.round((avg / MAX_MARKS) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl">🏆 Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Weekly average sadhana score • Only morning-japa attendees ranked</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="pb-3"><CardTitle className="font-serif text-lg">📋 How Ranking Works</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="font-semibold text-primary">⚡ Qualification:</span> Devotee must attend Morning Japa to be ranked.</p>
          <p><span className="font-semibold">Total marks per day: 240 + up to 20 weekly bonus.</span> Top earners across the last 7 days lead the board.</p>
          <p className="text-muted-foreground text-xs">
            Sleep 25 • Wake 25 • Chanting 25+10 • Day Rest 25 • Hearing 25 • Reading 25 • Study 25 • Exercise 25 • Morning Japa 10+20 (full at 100–120 min)
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif">Top Devotees (Last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <div className="text-muted-foreground py-6 text-center">Loading rankings…</div>}
          {!loading && rows.length === 0 && (
            <div className="text-muted-foreground py-6 text-center">No entries yet — be the first!</div>
          )}
          {rows.map((d, i) => (
            <div
              key={d.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                i === 0 ? "bg-yellow-500/10 border-yellow-500/40" :
                i === 1 ? "bg-slate-400/10 border-slate-400/30" :
                i === 2 ? "bg-amber-700/10 border-amber-700/30" :
                "bg-muted/30"
              }`}
            >
              <div className="w-8 grid place-items-center">{rankIcon(i)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {i === 0 ? "🥇 1st Rank" : i === 1 ? "🥈 2nd Rank" : i === 2 ? "🥉 3rd Rank" : `Rank #${i + 1}`}
                  {" • "}{d.days_tracked} day{d.days_tracked === 1 ? "" : "s"} tracked
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-serif text-primary">{pct(d.avg_score)}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">avg score</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
