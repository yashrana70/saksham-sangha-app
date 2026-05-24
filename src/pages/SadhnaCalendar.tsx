import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Entry = {
  id: string;
  entry_date: string;
  japa_rounds: number | null;
  hearing_minutes: number | null;
  hearing_topic: string | null;
  reading_minutes: number | null;
  reading_topic: string | null;
  seva_minutes: number | null;
  notes: string | null;
  devotee_name: string | null;
  facilitator_name: string | null;
};

export default function SadhnaCalendar() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    devotee_name: "",
    japa_rounds: 16,
    hearing_minutes: 0,
    hearing_topic: "",
    reading_minutes: 0,
    reading_topic: "",
    seva_minutes: 0,
    notes: "",
    facilitator_name: "",
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("sadhna_entries")
      .select("*").eq("user_id", user.id).order("entry_date", { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEntries((data as any) || []);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  const filledDates = useMemo(
    () => new Set(entries.map(e => e.entry_date)),
    [entries]
  );

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : "";
  const existing = entries.find(e => e.entry_date === selectedKey);

  const openEditor = (date: Date) => {
    setSelected(date);
    const k = format(date, "yyyy-MM-dd");
    const ex = entries.find(e => e.entry_date === k);
    setForm({
      devotee_name: ex?.devotee_name || "",
      japa_rounds: ex?.japa_rounds ?? 16,
      hearing_minutes: ex?.hearing_minutes ?? 0,
      hearing_topic: ex?.hearing_topic || "",
      reading_minutes: ex?.reading_minutes ?? 0,
      reading_topic: ex?.reading_topic || "",
      seva_minutes: ex?.seva_minutes ?? 0,
      notes: ex?.notes || "",
      facilitator_name: ex?.facilitator_name || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user || !selected) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      entry_date: selectedKey,
      devotee_name: form.devotee_name || null,
      japa_rounds: Number(form.japa_rounds),
      hearing_minutes: Number(form.hearing_minutes),
      hearing_topic: form.hearing_topic || null,
      reading_minutes: Number(form.reading_minutes),
      reading_topic: form.reading_topic || null,
      seva_minutes: Number(form.seva_minutes),
      notes: form.notes || null,
      facilitator_name: form.facilitator_name || null,
    };
    let error;
    if (existing) {
      ({ error } = await supabase.from("sadhna_entries").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("sadhna_entries").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(existing ? "Updated 🪔" : "Saved 🙏");
    setOpen(false);
    await load();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl">Sadhna Calendar</h1>
        <p className="text-muted-foreground text-sm">
          Tap any date to fill or edit your sadhna — perfect for catching up on missed days.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card className="shadow-elegant w-fit">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => d && openEditor(d)}
              modifiers={{
                filled: (d) => filledDates.has(format(d, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                filled: "bg-primary/15 text-primary font-bold ring-1 ring-primary/40 rounded-md",
              }}
              className="pointer-events-auto"
              disabled={(d) => d > new Date()}
            />
            <div className="flex items-center gap-4 px-2 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/30 ring-1 ring-primary/40" /> Filled</span>
              <span className="flex items-center gap-1.5"><CircleDashed className="h-3 w-3" /> Empty — click to add</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif">Recent Entries</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[28rem] overflow-y-auto">
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground">No entries yet — start by clicking a date.</p>
            )}
            {entries.slice(0, 30).map(e => (
              <button
                key={e.id}
                onClick={() => openEditor(new Date(e.entry_date))}
                className={cn(
                  "w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border",
                  "hover:bg-muted/60 transition-colors text-left"
                )}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{format(new Date(e.entry_date), "dd MMM yyyy")}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.japa_rounds || 0} rounds · {e.hearing_minutes || 0}m hearing · {e.reading_minutes || 0}m reading
                    </div>
                  </div>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {existing ? "Edit" : "Add"} Sadhna — {selected && format(selected, "dd MMM yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-4 py-2">
            <div><Label>Devotee Name</Label><Input value={form.devotee_name} onChange={e => setForm({ ...form, devotee_name: e.target.value })} /></div>
            <div><Label>Facilitator Name</Label><Input value={form.facilitator_name} onChange={e => setForm({ ...form, facilitator_name: e.target.value })} /></div>
            <div><Label>Japa Rounds</Label><Input type="number" min="0" max="200" value={form.japa_rounds} onChange={e => setForm({ ...form, japa_rounds: +e.target.value })} /></div>
            <div className="hidden sm:block" />
            <div><Label>Hearing (min)</Label><Input type="number" min="0" value={form.hearing_minutes} onChange={e => setForm({ ...form, hearing_minutes: +e.target.value })} /></div>
            <div><Label>Hearing Topic</Label><Input value={form.hearing_topic} onChange={e => setForm({ ...form, hearing_topic: e.target.value })} /></div>
            <div><Label>Reading (min)</Label><Input type="number" min="0" value={form.reading_minutes} onChange={e => setForm({ ...form, reading_minutes: +e.target.value })} /></div>
            <div><Label>Reading Topic</Label><Input value={form.reading_topic} onChange={e => setForm({ ...form, reading_topic: e.target.value })} /></div>
            <div><Label>Seva (min)</Label><Input type="number" min="0" value={form.seva_minutes} onChange={e => setForm({ ...form, seva_minutes: +e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="btn-liquid-glass h-11 px-6">
              {saving ? "Saving…" : existing ? "Update Sadhna" : "Save Sadhna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
