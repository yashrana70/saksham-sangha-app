import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { BookOpenCheck, BarChart3, CalendarDays, Sparkles, Trophy, Medal, Award, Cake, Info, Quote } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/saksham-logo.png";

type RankRow = { user_id: string; name: string; avg: number; days: number };
type Birthday = { user_id: string; name: string; dob: string; days_until: number };

const PRABHUPADA_QUOTES = [
  "Chant Hare Krishna and be happy.",
  "The whole world is suffering for want of Krishna consciousness.",
  "We are not these bodies; we are eternal spirit souls, part and parcel of Krishna.",
  "Real happiness is to revive our eternal relationship with Krishna.",
  "Books are the basis, purity is the force, preaching is the essence, utility is the principle.",
  "Simple living and high thinking is the perfection of human life.",
  "Krishna consciousness is not a sectarian religion; it is the original spiritual culture of every living being.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [name, setName] = useState("Devotee");
  const [role, setRole] = useState<string>("devotee");
  const [stats, setStats] = useState({ entries: 0, totalRounds: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [topDevotees, setTopDevotees] = useState<RankRow[]>([]);
  const [showRankings, setShowRankings] = useState(false);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const quote = PRABHUPADA_QUOTES[new Date().getDate() % PRABHUPADA_QUOTES.length];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (prof?.full_name) setName(prof.full_name);

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (roleData?.role) setRole(roleData.role);

      const today = new Date().toISOString().slice(0, 10);
      const { data: entries } = await supabase.from("sadhna_entries")
        .select("japa_rounds, entry_date").eq("user_id", user.id);
      if (entries) {
        setStats({
          entries: entries.length,
          totalRounds: entries.reduce((s, e) => s + (e.japa_rounds || 0), 0),
        });
        // 9 PM reminder if no entry for today
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filledToday = entries.some((e: any) => e.entry_date === today);
        const now = new Date();
        const after9pm = now.getHours() >= 21;
        const remindKey = `reminder_${today}`;
        if (after9pm && !filledToday && !sessionStorage.getItem(remindKey)) {
          sessionStorage.setItem(remindKey, "1");
          setTimeout(() => {
            toast.warning("🪔 Reminder: You haven't filled today's sadhna yet. Please fill it!", {
              duration: 10000,
              action: { label: "Fill now", onClick: () => (window.location.href = "/sadhna/new") },
            });
            // Browser notification (if permitted)
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("Saksham Sadhu Sang 🪔", {
                  body: "You haven't filled today's sadhna. Please fill it before sleeping!",
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            }
          }, 1200);
        }
      }
      const { data: ev } = await supabase.from("vaishnav_events")
        .select("*").gte("event_date", today).order("event_date").limit(5);
      setUpcoming(ev || []);

      if (ev && ev.length > 0) {
        const todayMs = new Date(today).getTime();
        const inTwoDaysMs = todayMs + (2 * 24 * 60 * 60 * 1000);
        const recent = ev.filter(e => {
          const eDateMs = new Date(e.event_date).getTime();
          return eDateMs >= todayMs && eDateMs <= inTwoDaysMs;
        });
        setRecentEvents(recent);
        if (recent.length > 0 && !sessionStorage.getItem("events_seen")) {
          sessionStorage.setItem("events_seen", "1");
          setTimeout(() => setShowEvents(true), 1200);
        }
      }

      // Fetch leaderboard via SECURITY DEFINER RPC (privacy-preserving aggregate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lb } = await (supabase as any).rpc("get_devotee_leaderboard", { _limit: 5 });
      if (lb && Array.isArray(lb)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ranked: RankRow[] = lb.map((r: any) => ({
          user_id: r.user_id,
          name: r.name || "Devotee",
          days: Number(r.days_tracked) || 0,
          avg: Number(r.avg_score) || 0,
        }));
        setTopDevotees(ranked);
        if (ranked.length >= 1 && !sessionStorage.getItem("rankings_seen")) {
          sessionStorage.setItem("rankings_seen", "1");
          setTimeout(() => setShowRankings(true), 800);
        }
      }
      // Upcoming birthdays (today + tomorrow)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bd } = await (supabase as any).rpc("get_upcoming_birthdays");
      if (Array.isArray(bd) && bd.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: Birthday[] = bd.map((b: any) => ({
          user_id: b.user_id, name: b.name, dob: b.dob, days_until: Number(b.days_until) || 0,
        }));
        setBirthdays(list);
        const bdKey = `birthdays_${today}`;
        if (!sessionStorage.getItem(bdKey)) {
          sessionStorage.setItem(bdKey, "1");
          setTimeout(() => setShowBirthdays(true), 1000);
        }
      }

      // Schedule 9 PM reminder if before 9pm and not filled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filledTodayCheck = entries?.some((e: any) => e.entry_date === today);
      const nowMs = Date.now();
      const nineMs = new Date(); nineMs.setHours(21, 0, 0, 0);
      if (!filledTodayCheck && nowMs < nineMs.getTime()) {
        const delay = nineMs.getTime() - nowMs;
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        setTimeout(() => {
          toast.warning("🪔 Please fill today's sadhna — it's 9 PM!", {
            duration: 15000,
            action: { label: "Fill now", onClick: () => (window.location.href = "/sadhna/new") },
          });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Saksham Sadhu Sang 🪔", {
              body: "Please fill your sadhna for today before sleeping.",
            });
          }
        }, delay);
      }
    })();
  }, [user]);

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (i === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground w-5 text-center">{i + 1}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-primary/20 shadow-elegant">
        <div className="bg-gradient-divine p-6 md:p-8 text-primary-foreground relative">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Saksham" className="h-20 w-20 rounded-full ring-4 ring-primary-glow/40" />
            <div>
              <p className="text-sm opacity-80">Hare Krishna 🙏</p>
              <h1 className="font-serif text-3xl md:text-4xl">Welcome, {name}</h1>
              <p className="mt-1 text-xs md:text-sm opacity-90 italic">"Aapka Saksham Path"</p>
              <p className="mt-1 text-[11px] md:text-xs opacity-80">
                🏛️ A Devotional Initiative under ISKCON Ayodhya
              </p>
              {["admin", "operator", "volunteer"].includes(role) && (
                <Button asChild variant="outline" className="mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20 transition-colors">
                  <a href="http://localhost:5174" target="_blank" rel="noopener noreferrer">
                    Go to Dashboard
                  </a>
                </Button>
              )}
            </div>
          </div>
          <Sparkles className="absolute right-6 top-6 opacity-30 h-12 w-12" />
        </div>
      </Card>

      {birthdays.length > 0 && (
        <Card className="border-pink-500/30 bg-gradient-to-r from-pink-500/10 via-primary/10 to-yellow-500/10 shadow-elegant">
          <CardContent className="p-4 flex items-center gap-3">
            <Cake className="h-7 w-7 text-pink-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-serif text-lg">
                {birthdays.some(b => b.days_until === 0) ? "🎂 Birthday Today!" : "🎂 Birthday Tomorrow"}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {birthdays.map(b => `${b.name}${b.days_until === 0 ? " (today)" : " (tomorrow)"}`).join(", ")}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowBirthdays(true)}>View</Button>
          </CardContent>
        </Card>
      )}

      {/* Quote of the Day — refined */}
      <Card className="relative overflow-hidden border-primary/30 shadow-elegant">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent pointer-events-none" />
        <div className="absolute -top-4 -left-2 opacity-10">
          <Quote className="h-28 w-28 text-primary" />
        </div>
        <CardContent className="relative p-6 md:p-7">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-2 font-semibold">Quote of the Day</div>
          <blockquote className="font-serif text-xl md:text-2xl leading-relaxed text-foreground">
            <span className="text-primary text-3xl mr-1 align-top">“</span>
            {quote}
            <span className="text-primary text-3xl ml-1 align-bottom">”</span>
          </blockquote>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-primary/10">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
            <div>
              <div className="text-sm font-serif text-primary font-semibold">His Divine Grace</div>
              <div className="text-xs text-muted-foreground">A.C. Bhaktivedanta Swami Srila Prabhupada</div>
              <div className="text-[10px] text-muted-foreground italic">Founder-Acharya, ISKCON</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Ranking Works */}
      <Card className="border-primary/20 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> How to Reach Top 3 on Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="font-semibold text-primary mb-1">⚡ First Rule</div>
            <div className="text-muted-foreground">
              Only devotees who <span className="font-semibold text-foreground">attend Morning Japa</span> qualify for the leaderboard. No morning japa = no rank.
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Marking Scheme — Total <span className="text-primary">240 marks</span> + 20 bonus</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>🌙 Sleep Time (≤10:15 PM)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>🌅 Wake-up (≤4:45 AM)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>📿 Chanting completion (≤7:15 AM)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>🎯 Target rounds (same day)</span><span className="font-semibold text-primary">10</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>😴 Day rest (≤60 min)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>👂 Hearing (≥25 min)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>📖 Reading (≥25 min)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>📚 Study/Job (≥8 hr)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-muted/40 px-2 py-1.5"><span>🏃 Exercise (≥30 min)</span><span className="font-semibold text-primary">25</span></div>
              <div className="flex justify-between rounded bg-primary/10 border border-primary/30 px-2 py-1.5"><span>🪔 Morning Japa attended</span><span className="font-semibold text-primary">10</span></div>
              <div className="flex justify-between rounded bg-primary/10 border border-primary/30 px-2 py-1.5"><span>⏱️ Morning Japa 100–120 min</span><span className="font-semibold text-primary">20</span></div>
              <div className="flex justify-between rounded bg-yellow-500/10 border border-yellow-500/30 px-2 py-1.5 sm:col-span-2"><span>🎉 Weekly bonus (7-day morning japa streak)</span><span className="font-semibold text-yellow-600">+20</span></div>
            </div>
          </div>
          <div className="rounded-lg border bg-gradient-to-r from-yellow-500/5 to-primary/5 p-3">
            <div className="font-semibold mb-1">🏆 Tips for Top 3</div>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground text-xs">
              <li>Attend morning japa daily — 100–120 minutes for full marks</li>
              <li>Sleep before 10:15 PM, wake by 4:45 AM</li>
              <li>Complete all your rounds before 7:15 AM, same day</li>
              <li>Hear & read at least 25 min each — choose meaningful topics</li>
              <li>Submit sadhna every single day to keep your weekly average high</li>
            </ul>
          </div>
        </CardContent>
      </Card>


      {topDevotees.length > 0 && (
        <Card className="border-primary/30 shadow-elegant overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <CardTitle className="font-serif flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Most Active Devotees
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leaderboard">Full Leaderboard</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {topDevotees.slice(0, 3).map((d, i) => (
              <div key={d.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                <div className="w-8 grid place-items-center">{rankIcon(i)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.days} day{d.days === 1 ? "" : "s"} this week</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-serif text-primary">{Math.min(100, Math.round((d.avg / 240) * 100))}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">avg score</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft hover:shadow-elegant transition-shadow">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Sadhna Entries</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-serif text-primary">{stats.entries}</div></CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-elegant transition-shadow">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Japa Rounds</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-serif text-primary">{stats.totalRounds}</div></CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-elegant transition-shadow">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Upcoming Events</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-serif text-primary">{upcoming.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/sadhna/new">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-start gap-2">
              <BookOpenCheck className="h-8 w-8 text-primary" />
              <h3 className="font-serif text-xl">Submit Sadhna</h3>
              <p className="text-sm text-muted-foreground">Record today's japa, hearing, reading & seva.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/reports">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-start gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h3 className="font-serif text-xl">Sadhna Reports</h3>
              <p className="text-sm text-muted-foreground">View progress charts, daily/monthly history & export CSV.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/calendar/vaishnav">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-start gap-2">
              <CalendarDays className="h-8 w-8 text-primary" />
              <h3 className="font-serif text-xl">Vaishnav Calendar</h3>
              <p className="text-sm text-muted-foreground">Ekadashis, festivals & appearance days with reminders.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-serif">🪔 Upcoming Vaishnav Events</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map(e => (
              <div key={e.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.event_type}</div>
                </div>
                <div className="text-sm text-primary font-semibold">
                  {new Date(e.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rankings Popup */}
      <Dialog open={showRankings} onOpenChange={setShowRankings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Most Active Devotees
            </DialogTitle>
            <DialogDescription>
              Ranked by weekly average sadhana score (% of 240 max marks)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {topDevotees.map((d, i) => (
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
                    {i === 0 ? "🥇 1st Rank" : i === 1 ? "🥈 2nd Rank" : i === 2 ? "🥉 3rd Rank" : `${i + 1}th Rank`}
                    {" • "}{d.days} days
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif text-primary">{Math.min(100, Math.round((d.avg / 240) * 100))}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">avg score</div>
                </div>
              </div>
            ))}
            {topDevotees.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">
                No sadhna entries yet — be the first!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBirthdays} onOpenChange={setShowBirthdays}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <Cake className="h-6 w-6 text-pink-500" /> Birthday Wishes
            </DialogTitle>
            <DialogDescription>A blessed Krishna conscious birthday 🙏</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {birthdays.map(b => (
              <div key={b.user_id} className="rounded-lg border bg-gradient-to-br from-pink-500/10 via-primary/5 to-yellow-500/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{b.days_until === 0 ? "🎉" : "🎂"}</span>
                  <div className="flex-1">
                    <div className="font-serif text-lg">{b.name}</div>
                    <div className="text-xs text-primary font-semibold">
                      {b.days_until === 0 ? "🌟 Birthday Today!" : "📅 Birthday Tomorrow"}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  Hare Krishna {b.name}! 🙏 May Sri Sri Radha-Krishna shower their choicest blessings upon you.
                  May your devotion deepen, your chanting increase, and may you make rapid spiritual progress
                  under the shelter of Srila Prabhupada. Wishing you a very blessed Krishna conscious birthday! 🌸
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      <Dialog open={showEvents} onOpenChange={setShowEvents}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" /> Upcoming Events
            </DialogTitle>
            <DialogDescription>Don't miss these important dates!</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {recentEvents.map((e) => (
              <div key={e.id} className="rounded-lg border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🪔</span>
                  <div className="flex-1">
                    <div className="font-serif text-lg">{e.title}</div>
                    <div className="text-xs text-primary font-semibold">
                      {new Date(e.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{e.description || e.event_type}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
