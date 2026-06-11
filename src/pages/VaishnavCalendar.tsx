import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { Bell, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


type Event = {
  id: string;
  title: string;
  event_date: string;
  event_type: string | null;
  description: string | null;
};

const typeColor = (t?: string | null) => {
  if (t === "ekadashi") return "bg-primary/15 text-primary border-primary/30";
  if (t === "festival") return "bg-accent/20 text-accent-foreground border-accent/40";
  if (t === "appearance") return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-100";
  if (t === "disappearance") return "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800/40 dark:text-slate-100";
  return "bg-secondary/15 text-secondary border-secondary/30";
};

export default function VaishnavCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("vaishnav_events")
        .select("*").order("event_date");
        
      if (error) {
        console.error("Supabase error:", error);
        setFetchError(error.message);
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (data as any[]) || [];
      setEvents(list);

      // popup reminder for events 1–2 days away (only once per session per event)
      const today = new Date();
      const upcoming = list.filter(e => {
        const diff = differenceInCalendarDays(parseISO(e.event_date), today);
        return diff === 1 || diff === 2;
      });
      const shownKey = "saksham_reminders_shown";
      const shown: string[] = JSON.parse(sessionStorage.getItem(shownKey) || "[]");
      upcoming.forEach(e => {
        if (shown.includes(e.id)) return;
        const diff = differenceInCalendarDays(parseISO(e.event_date), today);
        toast(`🪔 ${e.title} in ${diff} day${diff > 1 ? "s" : ""}`, {
          description: format(parseISO(e.event_date), "EEEE, dd MMM yyyy"),
          duration: 8000,
          action: { label: "View", onClick: () => setReminderEvent(e) },
        });
        shown.push(e.id);
      });
      sessionStorage.setItem(shownKey, JSON.stringify(shown));
    })();
  }, []);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, Event[]>();
    events.forEach(e => {
      // Normalize the date to YYYY-MM-DD to avoid timezone shifting issues and exact string mismatch
      const dateKey = e.event_date.split('T')[0]; 
      const arr = m.get(dateKey) || [];
      arr.push(e);
      m.set(dateKey, arr);
    });
    return m;
  }, [events]);

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : "";
  const selectedEvents = eventsByDate.get(selectedKey) || [];

  const today = new Date();
  const upcoming = events
    .filter(e => parseISO(e.event_date) >= new Date(today.toDateString()))
    .slice(0, 12);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" /> Vaishnav Calendar
          </h1>
          <p className="text-muted-foreground text-sm">Ekadashis, festivals & appearance days · 2026</p>
        </div>
        <Badge variant="outline" className="gap-1.5"><Bell className="h-3 w-3" /> Reminders 1–2 days before</Badge>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-100 text-red-900 border border-red-300 rounded-lg">
          <p className="font-bold">Error fetching calendar:</p>
          <p className="text-sm font-mono mt-1">{fetchError}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card className="shadow-elegant w-fit">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={{
                ekadashi: (d) => (eventsByDate.get(format(d, "yyyy-MM-dd")) || []).some(e => e.event_type === "ekadashi"),
                festival: (d) => (eventsByDate.get(format(d, "yyyy-MM-dd")) || []).some(e => e.event_type === "festival"),
                acharya: (d) => (eventsByDate.get(format(d, "yyyy-MM-dd")) || []).some(e => e.event_type === "appearance" || e.event_type === "disappearance"),
              }}
              modifiersClassNames={{
                ekadashi: "bg-primary/15 text-primary font-bold ring-1 ring-primary/40 rounded-md",
                festival: "bg-accent/25 text-accent-foreground font-bold ring-1 ring-accent/50 rounded-md",
                acharya: "bg-emerald-100 text-emerald-900 font-semibold ring-1 ring-emerald-300 rounded-md dark:bg-emerald-900/30 dark:text-emerald-100",
              }}
              className="pointer-events-auto"
            />
            <div className="flex flex-wrap items-center gap-3 px-2 pt-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/30 ring-1 ring-primary/40" /> Ekadashi</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent/40 ring-1 ring-accent/60" /> Festival</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-200 ring-1 ring-emerald-400" /> Acharya Day</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">
                {selected && format(selected, "EEEE, dd MMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No special observance on this date.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => (
                    <div key={e.id} className={cn("p-3 rounded-lg border", typeColor(e.event_type))}>
                      <div className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> {e.title}</div>
                      {e.description && <div className="text-xs mt-1 opacity-90">{e.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-serif">Upcoming Observances</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {upcoming.map(e => {
                const diff = differenceInCalendarDays(parseISO(e.event_date), today);
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelected(parseISO(e.event_date))}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/60 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{e.event_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">
                        {format(parseISO(e.event_date), "dd MMM")}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `in ${diff} days`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!reminderEvent} onOpenChange={(o) => !o && setReminderEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> {reminderEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <div><strong>Date:</strong> {reminderEvent && format(parseISO(reminderEvent.event_date), "EEEE, dd MMM yyyy")}</div>
            {reminderEvent?.event_type && <div><strong>Type:</strong> <span className="capitalize">{reminderEvent.event_type}</span></div>}
            {reminderEvent?.description && <p className="text-muted-foreground">{reminderEvent.description}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
