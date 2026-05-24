import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ListChecks, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null; // Storing the "due_time" here to avoid db schema changes
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
};

// Local audio file for reliable playback without CORS or external server issues
const HARE_KRISHNA_URL = "/hare_krishna.mp3";

export default function DailyTodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueTime, setDueTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep track of which alarms have already rung to avoid spamming
  const [rungAlarms, setRungAlarms] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("todo_items")
      .select("*")
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTodos((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    load();
    
    // Setup Audio
    audioRef.current = new Audio(HARE_KRISHNA_URL);
    audioRef.current.loop = false;
  }, [user]);

  // Alarm Checker Interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentYMD = format(now, "yyyy-MM-dd");
      const currentHM = format(now, "HH:mm");

      todos.forEach(t => {
        if (!t.completed && t.due_date === currentYMD && t.description === currentHM) {
          if (!rungAlarms.has(t.id)) {
            // It's time!
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.error("Audio play failed, user didn't interact yet:", e));
            }
            toast("Hare Krishna! 🪔 It is time for your task!", {
              description: t.title,
              action: {
                label: "Stop Audio",
                onClick: () => stopAudio()
              },
              duration: 20000,
            });
            setRungAlarms(prev => new Set(prev).add(t.id));
          }
        }
      });
    }, 10000); // check every 10 seconds

    return () => clearInterval(interval);
  }, [todos, rungAlarms]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) { toast.error("Enter a task"); return; }
    setAdding(true);
    const { error } = await supabase.from("todo_items").insert({
      user_id: user.id,
      title: title.trim(),
      due_date: dueDate || null,
      description: dueTime || null, // Storing time in description
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setTitle("");
    setDueTime("");
    toast.success("Task added 🪔");
    load();
  };

  const toggle = async (t: Todo) => {
    const next = !t.completed;
    const { error } = await supabase
      .from("todo_items")
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    if (next && audioRef.current) stopAudio(); // stop if they check it off while ringing
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("todo_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const pending = todos.filter(t => !t.completed).length;

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" /> My Daily Routine
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {pending} pending · {todos.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addTodo} className="flex gap-2 flex-wrap">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Mangala Aarti…"
            className="flex-1 min-w-[180px]"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-auto"
          />
          <div className="relative">
            <Bell className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              className="w-auto pl-8"
              title="Set an alarm time"
            />
          </div>
          <Button type="submit" disabled={adding} className="btn-liquid-glass gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tasks yet — add your first daily routine 🌅
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {todos.map(t => (
              <div
                key={t.id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-card/50 transition-colors ${
                  t.completed ? "opacity-60" : ""
                }`}
              >
                <Checkbox checked={t.completed} onCheckedChange={() => toggle(t)} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${t.completed ? "line-through" : ""}`}>
                    {t.title}
                  </div>
                  {(t.due_date || t.description) && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      {t.due_date && <span>{format(new Date(t.due_date), "EEE, dd MMM")}</span>}
                      {t.description && (
                        <span className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2">
                          <BellRing className="h-3 w-3" /> {t.description}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
