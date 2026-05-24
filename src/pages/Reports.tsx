import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BookOpenCheck, Headphones, BookOpen, Sparkles, Flame, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from "date-fns";

type Entry = {
  id: string;
  entry_date: string;
  devotee_name: string | null;
  japa_rounds: number | null;
  hearing_minutes: number | null;
  hearing_topic: string | null;
  reading_minutes: number | null;
  reading_topic: string | null;
  seva_minutes: number | null;
  facilitator_name: string | null;
  notes: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = ({ icon: Icon, label, value, hint }: any) => (
  <Card className="shadow-soft hover:shadow-elegant transition-shadow">
    <CardContent className="p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-soft">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-3xl font-serif text-foreground">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
    </CardContent>
  </Card>
);

export default function Reports() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("sadhna_entries")
        .select("*").eq("user_id", user.id).order("entry_date", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEntries((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  // ----- Daily (last 14 days) chart -----
  const dailyData = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 13);
    const days = eachDayOfInterval({ start, end });
    const map = new Map(entries.map(e => [e.entry_date, e]));
    return days.map(d => {
      const k = format(d, "yyyy-MM-dd");
      const e = map.get(k);
      return {
        date: format(d, "dd MMM"),
        japa: e?.japa_rounds || 0,
        hearing: e?.hearing_minutes || 0,
        reading: e?.reading_minutes || 0,
        seva: e?.seva_minutes || 0,
      };
    });
  }, [entries]);

  // ----- Monthly view -----
  const monthEntries = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const s = startOfMonth(new Date(y, m - 1, 1));
    const e = endOfMonth(s);
    return entries.filter(en => {
      const d = parseISO(en.entry_date);
      return d >= s && d <= e;
    });
  }, [entries, month]);

  const monthlyChart = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const s = startOfMonth(new Date(y, m - 1, 1));
    const e = endOfMonth(s);
    const days = eachDayOfInterval({ start: s, end: e });
    const map = new Map(monthEntries.map(en => [en.entry_date, en]));
    return days.map(d => {
      const k = format(d, "yyyy-MM-dd");
      const en = map.get(k);
      return {
        day: format(d, "d"),
        japa: en?.japa_rounds || 0,
        total_min: (en?.hearing_minutes || 0) + (en?.reading_minutes || 0) + (en?.seva_minutes || 0),
      };
    });
  }, [monthEntries, month]);

  const totals = useMemo(() => {
    const totalRounds = entries.reduce((s, e) => s + (e.japa_rounds || 0), 0);
    const totalHear = entries.reduce((s, e) => s + (e.hearing_minutes || 0), 0);
    const totalRead = entries.reduce((s, e) => s + (e.reading_minutes || 0), 0);
    const totalSeva = entries.reduce((s, e) => s + (e.seva_minutes || 0), 0);
    const days = entries.length;
    const avgRounds = days ? (totalRounds / days).toFixed(1) : "0";
    // streak — consecutive days ending today
    const set = new Set(entries.map(e => e.entry_date));
    let streak = 0;
    let cur = new Date();
    while (set.has(format(cur, "yyyy-MM-dd"))) { streak++; cur = subDays(cur, 1); }
    return { days, totalRounds, totalHear, totalRead, totalSeva, avgRounds, streak };
  }, [entries]);

  const exportCSV = (rows: Entry[], filename: string) => {
    const headers = [
      "Date", "Devotee", "Japa Rounds", "Hearing (min)", "Hearing Topic",
      "Reading (min)", "Reading Topic", "Seva (min)", "Facilitator", "Notes",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map(r => [
        r.entry_date, r.devotee_name, r.japa_rounds, r.hearing_minutes, r.hearing_topic,
        r.reading_minutes, r.reading_topic, r.seva_minutes, r.facilitator_name, r.notes,
      ].map(escape).join(",")),
    ].join("\n");
    try {
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Sadhna Reports</h1>
          <p className="text-muted-foreground text-sm">Your spiritual progress at a glance</p>
        </div>
        {isAdmin && (
          <Button onClick={() => exportCSV(entries, `saksham-sadhna-all-${Date.now()}.csv`)} className="btn-liquid-glass h-11">
            <Download className="h-4 w-4 mr-2" /> Export All (CSV)
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpenCheck} label="Entries" value={totals.days} />
        <StatCard icon={Sparkles} label="Total Rounds" value={totals.totalRounds} hint={`Avg ${totals.avgRounds} / day`} />
        <StatCard icon={Headphones} label="Hearing (min)" value={totals.totalHear} />
        <StatCard icon={BookOpen} label="Reading (min)" value={totals.totalRead} />
        <StatCard icon={Flame} label="Current Streak" value={`${totals.streak} 🔥`} hint="consecutive days" />
        <StatCard icon={TrendingUp} label="Seva (min)" value={totals.totalSeva} />
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-serif">Last 14 Days — Japa Rounds</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="japa" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-serif">Last 14 Days — Time Spent (min)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="hearing" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reading" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="seva" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-serif">Monthly View</CardTitle>
              <div className="flex items-center gap-2">
                <input
                  type="month" value={month} onChange={e => setMonth(e.target.value)}
                  className="border border-input rounded-md px-3 py-1.5 text-sm bg-background"
                />
                {isAdmin && (
                  <Button variant="outline" size="sm"
                    onClick={() => exportCSV(monthEntries, `saksham-sadhna-${month}.csv`)}>
                    <Download className="h-4 w-4 mr-2" /> CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--secondary))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="japa" name="Japa Rounds" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="total_min" name="Total Minutes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-serif">{month} — Entries ({monthEntries.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Devotee</TableHead><TableHead>Japa</TableHead>
                    <TableHead>Hearing</TableHead><TableHead>Reading</TableHead><TableHead>Seva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthEntries.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No entries this month yet.</TableCell></TableRow>
                  )}
                  {monthEntries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{format(parseISO(e.entry_date), "dd MMM")}</TableCell>
                      <TableCell>{e.devotee_name || "—"}</TableCell>
                      <TableCell className="font-semibold text-primary">{e.japa_rounds || 0}</TableCell>
                      <TableCell>{e.hearing_minutes || 0}m</TableCell>
                      <TableCell>{e.reading_minutes || 0}m</TableCell>
                      <TableCell>{e.seva_minutes || 0}m</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="font-serif">All Entries ({entries.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Devotee</TableHead><TableHead>Japa</TableHead>
                    <TableHead>Hearing</TableHead><TableHead>Hearing Topic</TableHead>
                    <TableHead>Reading</TableHead><TableHead>Reading Topic</TableHead>
                    <TableHead>Seva</TableHead><TableHead>Facilitator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">No sadhna entries yet — submit your first one!</TableCell></TableRow>
                  )}
                  {entries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{format(parseISO(e.entry_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{e.devotee_name || "—"}</TableCell>
                      <TableCell className="font-semibold text-primary">{e.japa_rounds || 0}</TableCell>
                      <TableCell>{e.hearing_minutes || 0}m</TableCell>
                      <TableCell className="max-w-[180px] truncate">{e.hearing_topic || "—"}</TableCell>
                      <TableCell>{e.reading_minutes || 0}m</TableCell>
                      <TableCell className="max-w-[180px] truncate">{e.reading_topic || "—"}</TableCell>
                      <TableCell>{e.seva_minutes || 0}m</TableCell>
                      <TableCell>{e.facilitator_name || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
