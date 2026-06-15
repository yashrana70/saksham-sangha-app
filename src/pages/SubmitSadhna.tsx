import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Upload, Share2, Copy, Check, Trophy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  calculateMarks, type MarksBreakdown, targetRoundsForLevel,
  POSITIVE_CHETNA, NEGATIVE_CHETNA,
} from "@/lib/marking";
import { cn } from "@/lib/utils";

const schema = z.object({
  entry_date: z.string().min(1, "Date required"),
  devotee_name: z.string().trim().min(2).max(100),
  assigned_mentor: z.string().trim().min(2).max(100),
  japa_rounds: z.number().min(0).max(200),
  target_rounds: z.number().min(1).max(200),
  hearing_minutes: z.number().min(0).max(1440),
  hearing_topic: z.string().trim().min(1).max(200),
  reading_minutes: z.number().min(0).max(1440),
  reading_topic: z.string().trim().min(1).max(200),
  seva_minutes: z.number().min(0).max(1440),
  day_rest_minutes: z.number().min(0).max(1440),
  wake_up_time: z.string().min(1),
  sleep_time: z.string().min(1),
  chanting_completion_time: z.string().min(1),
  study_hours: z.number().min(0).max(24),
  exercise_minutes: z.number().min(0).max(1440),
  morning_japa_duration: z.number().min(0).max(240),
});

function Chip({ label, active, onClick, variant }: { label: string; active: boolean; onClick: () => void; variant: "pos" | "neg" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        active
          ? variant === "pos"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-destructive text-destructive-foreground border-destructive shadow-sm"
          : "bg-muted/40 text-foreground border-border hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

export default function SubmitSadhna() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [marks, setMarks] = useState<MarksBreakdown | null>(null);
  const [bvLevel, setBvLevel] = useState<string>("");

  const [f, setF] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    devotee_name: "",
    japa_rounds: 16,
    target_rounds: 16,
    hearing_minutes: 0,
    hearing_topic: "",
    reading_minutes: 0,
    reading_topic: "",
    seva_minutes: 0,
    service_details: "",
    day_rest_minutes: 0,
    wake_up_time: "",
    sleep_time: "",
    chanting_completion_time: "",
    completed_same_day: true,
    study_hours: 0,
    exercise_minutes: 0,
    morning_japa_attended: false,
    morning_japa_duration: 0,
    positive_chetna: [] as string[],
    negative_chetna: [] as string[],
    notes: "",
    assigned_mentor: "",
    image_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("assigned_mentor,full_name,devotee_level,bhakti_vriksha_level")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d: any = data;
        const lvl = d.bhakti_vriksha_level
          ?? (typeof d.devotee_level === "string" && d.devotee_level.match(/Level\s*(\d)/i)?.[1]);
        const target = targetRoundsForLevel(lvl);
        setBvLevel(d.devotee_level || (lvl ? `Bhakti Vriksha Level ${lvl}` : ""));
        setF(prev => ({
          ...prev,
          assigned_mentor: prev.assigned_mentor || d.assigned_mentor || "",
          devotee_name: prev.devotee_name || d.full_name || "",
          target_rounds: target,
          japa_rounds: target,
        }));
      });
  }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/sadhna-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("sadhna-images").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("sadhna-images").getPublicUrl(path);
    setF(prev => ({ ...prev, image_url: data.publicUrl }));
    toast.success("Image attached");
  };

  const toggleChetna = (key: "positive_chetna" | "negative_chetna", val: string) => {
    setF(prev => {
      const curr = prev[key];
      return { ...prev, [key]: curr.includes(val) ? curr.filter(v => v !== val) : [...curr, val] };
    });
  };

  // Compute weekly morning japa bonus
  const computeWeeklyBonus = async (): Promise<number> => {
    if (!user) return 0;
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().slice(0, 10);
    const todayDate = f.entry_date;
    const { data } = await supabase
      .from("sadhna_entries")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("entry_date,morning_japa_attended" as any)
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .lte("entry_date", todayDate);
    const days = new Set<string>();
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of data as any[]) {
        if (r.morning_japa_attended) days.add(r.entry_date);
      }
    }
    if (f.morning_japa_attended) days.add(f.entry_date);
    return days.size >= 7 ? 20 : 0;
  };

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      entry_date: f.entry_date,
      devotee_name: f.devotee_name,
      assigned_mentor: f.assigned_mentor,
      japa_rounds: Number(f.japa_rounds),
      target_rounds: Number(f.target_rounds),
      hearing_minutes: Number(f.hearing_minutes),
      hearing_topic: f.hearing_topic,
      reading_minutes: Number(f.reading_minutes),
      reading_topic: f.reading_topic,
      seva_minutes: Number(f.seva_minutes),
      day_rest_minutes: Number(f.day_rest_minutes),
      wake_up_time: f.wake_up_time,
      sleep_time: f.sleep_time,
      chanting_completion_time: f.chanting_completion_time,
      study_hours: Number(f.study_hours),
      exercise_minutes: Number(f.exercise_minutes),
      morning_japa_duration: Number(f.morning_japa_duration),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    setSaving(true);

    // Check for existing entry on this date
    const { data: existing } = await supabase
      .from("sadhna_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("entry_date", f.entry_date)
      .maybeSingle();

    const weekly_bonus = await computeWeeklyBonus();
    const breakdown = calculateMarks({
      sleep_time: f.sleep_time,
      wake_up_time: f.wake_up_time,
      chanting_completion_time: f.chanting_completion_time,
      japa_rounds: Number(f.japa_rounds),
      target_rounds: Number(f.target_rounds),
      day_rest_minutes: Number(f.day_rest_minutes),
      hearing_minutes: Number(f.hearing_minutes),
      reading_minutes: Number(f.reading_minutes),
      study_hours: Number(f.study_hours),
      exercise_minutes: Number(f.exercise_minutes),
      morning_japa_attended: f.morning_japa_attended,
      morning_japa_duration: Number(f.morning_japa_duration),
      weekly_bonus,
      same_day: f.completed_same_day,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      user_id: user.id,
      entry_date: f.entry_date,
      devotee_name: f.devotee_name,
      japa_rounds: Number(f.japa_rounds),
      target_rounds: Number(f.target_rounds),
      hearing_minutes: Number(f.hearing_minutes),
      hearing_topic: f.hearing_topic,
      reading_minutes: Number(f.reading_minutes),
      reading_topic: f.reading_topic,
      seva_minutes: Number(f.seva_minutes),
      day_rest_minutes: Number(f.day_rest_minutes),
      wake_up_time: f.wake_up_time,
      sleep_time: f.sleep_time,
      chanting_completion_time: f.chanting_completion_time,
      notes: f.notes || null,
      assigned_mentor: f.assigned_mentor,
      image_url: f.image_url || null,
      total_marks: breakdown.total,
      study_hours: Number(f.study_hours),
      exercise_minutes: Number(f.exercise_minutes),
      morning_japa_attended: f.morning_japa_attended,
      morning_japa_duration: Number(f.morning_japa_duration),
      positive_chetna: f.positive_chetna,
      negative_chetna: f.negative_chetna,
      weekly_bonus,
      service_details: f.service_details || null,
    };

    let error;
    if (existing?.id) {
      const confirmEdit = window.confirm(
        `You've already submitted sadhna for ${f.entry_date}. Update existing entry instead?`
      );
      if (!confirmEdit) { setSaving(false); return; }
      ({ error } = await supabase.from("sadhna_entries").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("sadhna_entries").insert(payload));
    }

    setSaving(false);
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "23505") {
        toast.error("You already submitted sadhna for this date. Change the date or edit existing.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(`Hare Krishna 🙏 ${existing?.id ? "Updated" : "Submitted"} — ${breakdown.total} marks (${breakdown.percentage}%)`);
    setMarks(breakdown);
    setShared(true);
  };


  const shareText = () => {
    const targetCompleted = Number(f.japa_rounds) >= Number(f.target_rounds) && f.completed_same_day ? "Yes" : "No";
    const pct = marks ? `${marks.percentage}%` : "—";
    const totalLine = marks ? `${marks.total} / 240 (${marks.percentage}%)` : "—";
    return (
`Hare Krishna!
Daily Sadhana: ${new Date(f.entry_date).toLocaleDateString("en-IN")}

*Level*: ${bvLevel || "—"}
*Target Rounds*: ${f.target_rounds}

*Total Marks*: ${totalLine}
*Total Score*: ${pct}

*Prev Night Sleep Time*: ${f.sleep_time || "—"}
*Wake-Up Time*: ${f.wake_up_time || "—"}

*Chanting Rounds*: ${f.japa_rounds}/${f.target_rounds}
*Target Completed*: ${targetCompleted}
*Completed At*: ${f.chanting_completion_time || "—"}

*Morning Japa*: ${f.morning_japa_attended ? "Yes" : "No"}
*Morning Japa Duration*: ${f.morning_japa_duration} min

*Exercise Duration*: ${f.exercise_minutes} min
*Study/Job Duration*: ${f.study_hours} hrs
*Day Rest Duration*: ${f.day_rest_minutes} min

*Hearing Topic*: ${f.hearing_topic || "—"}
*Hearing Duration*: ${f.hearing_minutes} min

*Reading Topic*: ${f.reading_topic || "—"}
*Reading Duration*: ${f.reading_minutes} min

*Service Details*: ${f.service_details || "—"}
*Service Duration*: ${f.seva_minutes} min

*Positive Chetna*: ${f.positive_chetna.join(", ") || "—"}
*Negative Chetna*: ${f.negative_chetna.join(", ") || "—"}

*Comment*: ${f.notes || "—"}

🏛️ A Devotional Initiative under ISKCON Ayodhya 🙏`
    );
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank");
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareText());
    setCopied(true); toast.success("Copied!");
    setTimeout(() => setCopied(false), 1500);
  };
  const nativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Saksham Sadhna", text: shareText() }); } catch { /* ignore */ } }
    else copyLink();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl">Submit Sadhna</h1>
        <p className="text-muted-foreground text-sm">
          Record today's spiritual practice • <span className="text-primary">* required</span>
          {bvLevel && <> • Level: <span className="font-semibold">{bvLevel}</span> (Target: {f.target_rounds} rounds)</>}
        </p>
      </div>

      <Card className="shadow-elegant">
        <CardHeader><CardTitle className="font-serif">Today's Practice</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Date *</Label><Input type="date" required value={f.entry_date} onChange={e => setF({ ...f, entry_date: e.target.value })} /></div>
          <div><Label>Devotee Name *</Label><Input required value={f.devotee_name} onChange={e => setF({ ...f, devotee_name: e.target.value })} /></div>
          <div><Label>Spiritual Friend Name *</Label><Input required value={f.assigned_mentor} onChange={e => setF({ ...f, assigned_mentor: e.target.value })} /></div>
          <div><Label>Target Rounds *</Label><Input type="number" min="1" max="200" required value={f.target_rounds} onChange={e => setF({ ...f, target_rounds: +e.target.value })} /></div>

          <div><Label>Japa Rounds Completed *</Label><Input type="number" min="0" max="200" required value={f.japa_rounds} onChange={e => setF({ ...f, japa_rounds: +e.target.value })} /></div>
          <div><Label>Chanting Completion Time *</Label><Input type="time" required value={f.chanting_completion_time} onChange={e => setF({ ...f, chanting_completion_time: e.target.value })} /></div>

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div>
              <Label className="cursor-pointer">Completed Same Day?</Label>
              <p className="text-xs text-muted-foreground">Required for full chanting marks</p>
            </div>
            <Switch checked={f.completed_same_day} onCheckedChange={v => setF({ ...f, completed_same_day: v })} />
          </div>

          <div><Label>Hearing (minutes) *</Label><Input type="number" min="0" required value={f.hearing_minutes} onChange={e => setF({ ...f, hearing_minutes: +e.target.value })} /></div>
          <div><Label>Hearing Topic *</Label><Input required value={f.hearing_topic} onChange={e => setF({ ...f, hearing_topic: e.target.value })} /></div>

          <div><Label>Reading (minutes) *</Label><Input type="number" min="0" required value={f.reading_minutes} onChange={e => setF({ ...f, reading_minutes: +e.target.value })} /></div>
          <div><Label>Reading Topic *</Label><Input required value={f.reading_topic} onChange={e => setF({ ...f, reading_topic: e.target.value })} /></div>

          <div><Label>Seva / Service (minutes) *</Label><Input type="number" min="0" required value={f.seva_minutes} onChange={e => setF({ ...f, seva_minutes: +e.target.value })} /></div>
          <div><Label>Service Details</Label><Input value={f.service_details} onChange={e => setF({ ...f, service_details: e.target.value })} placeholder="What service did you do?" /></div>

          <div><Label>Day Rest (minutes) *</Label><Input type="number" min="0" required value={f.day_rest_minutes} onChange={e => setF({ ...f, day_rest_minutes: +e.target.value })} /></div>
          <div><Label>Study / Job Duration (hours) *</Label><Input type="number" min="0" max="24" step="0.5" required value={f.study_hours} onChange={e => setF({ ...f, study_hours: +e.target.value })} /></div>

          <div><Label>Exercise Duration (minutes) *</Label><Input type="number" min="0" required value={f.exercise_minutes} onChange={e => setF({ ...f, exercise_minutes: +e.target.value })} /></div>
          <div className="flex items-end gap-3 rounded-lg border p-3 bg-muted/30">
            <div className="flex-1">
              <Label>Morning Japa Attended?</Label>
              <p className="text-xs text-muted-foreground">Group japa in morning</p>
            </div>
            <Switch checked={f.morning_japa_attended} onCheckedChange={v => setF({ ...f, morning_japa_attended: v })} />
          </div>

          <div><Label>Morning Japa Duration (minutes) *</Label><Input type="number" min="0" max="240" required value={f.morning_japa_duration} onChange={e => setF({ ...f, morning_japa_duration: +e.target.value })} /></div>

          <div><Label>Wake-up Time *</Label><Input type="time" required value={f.wake_up_time} onChange={e => setF({ ...f, wake_up_time: e.target.value })} /></div>
          <div><Label>Sleep Time *</Label><Input type="time" required value={f.sleep_time} onChange={e => setF({ ...f, sleep_time: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-lg">🌸 Positive Chetna</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {POSITIVE_CHETNA.map(c => (
              <Chip key={c} label={c} active={f.positive_chetna.includes(c)} onClick={() => toggleChetna("positive_chetna", c)} variant="pos" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-lg">⚠️ Negative Chetna</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {NEGATIVE_CHETNA.map(c => (
              <Chip key={c} label={c} active={f.negative_chetna.includes(c)} onClick={() => toggleChetna("negative_chetna", c)} variant="neg" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif">Notes / Realizations (optional)</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={3} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif">Attach Image (optional)</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4 flex-wrap">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button variant="outline" onClick={() => camRef.current?.click()}><Camera className="h-4 w-4 mr-2" />Camera</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Gallery</Button>
          {f.image_url && <img src={f.image_url} alt="attached" className="h-20 w-20 rounded-lg object-cover ring-2 ring-primary/20" />}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={submit} disabled={saving} size="lg" className="btn-liquid-glass px-8 h-12">
          {saving ? "Submitting…" : "Submit Sadhna"}
        </Button>
        <Button variant="outline" size="lg" onClick={shareWhatsApp}><Share2 className="h-4 w-4 mr-2" /> WhatsApp</Button>
        <Button variant="outline" size="lg" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />} Copy
        </Button>
        <Button variant="outline" size="lg" onClick={nativeShare}><Share2 className="h-4 w-4 mr-2" /> Share…</Button>
      </div>

      {shared && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-sm">
            🪔 Submitted! Use the share buttons above to send your report to your Spiritual Friend.
          </CardContent>
        </Card>
      )}

      <Dialog open={!!marks} onOpenChange={o => !o && setMarks(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" /> Today's Marks
            </DialogTitle>
            <DialogDescription>VL1 Marking Scheme breakdown</DialogDescription>
          </DialogHeader>
          {marks && (
            <div className="space-y-2 mt-2">
              <Row label="Sleep Time" value={marks.sleep} />
              <Row label="Wake-up Time" value={marks.wake} />
              <Row label="Chanting Completion" value={marks.chanting_completion} />
              <Row label="Chanting Rounds (target hit)" value={marks.chanting_rounds} />
              <Row label="Day Rest" value={marks.day_rest} />
              <Row label="Hearing" value={marks.hearing} />
              <Row label="Reading" value={marks.reading} />
              <Row label="Study / Job" value={marks.study} />
              <Row label="Exercise" value={marks.exercise} />
              <Row label="Morning Japa Attendance" value={marks.morning_japa_attendance} />
              <Row label="Morning Japa Duration" value={marks.morning_japa_duration} />
              {marks.weekly_bonus > 0 && <Row label="🎉 Weekly Morning Japa Bonus" value={marks.weekly_bonus} />}
              <div className="flex items-center justify-between p-3 mt-2 rounded-lg bg-primary/10 border border-primary/30">
                <div className="font-serif text-lg">Total</div>
                <div className="text-right">
                  <div className="font-serif text-3xl text-primary">{marks.total}</div>
                  <div className="text-xs text-muted-foreground">{marks.percentage}% of {marks.max}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
      <div className="text-sm">{label}</div>
      <div className={`font-semibold ${value < 0 ? "text-destructive" : value === 0 ? "text-muted-foreground" : "text-primary"}`}>{value}</div>
    </div>
  );
}
