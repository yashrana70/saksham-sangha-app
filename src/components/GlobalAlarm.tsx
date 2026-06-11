import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type TodoItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
};

// Global audio context singleton to bypass strict browser autoplay restrictions
let globalAudioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) globalAudioCtx = new AudioCtx();
  }
};

const playBellSound = () => {
  try {
    initAudio();
    if (!globalAudioCtx) return;
    
    // Some browsers suspend context until user interacts
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume();
    }
    
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, globalAudioCtx.currentTime); // A5 note
    
    // Envelope for a bell/chime sound
    gain.gain.setValueAtTime(0, globalAudioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, globalAudioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + 2);
    
    osc.connect(gain);
    gain.connect(globalAudioCtx.destination);
    
    osc.start(globalAudioCtx.currentTime);
    osc.stop(globalAudioCtx.currentTime + 2);
  } catch (e) {
    console.error("Web Audio API failed to play:", e);
  }
};

export function GlobalAlarm() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const [rungAlarms, setRungAlarms] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("spark_rung_alarms") || "[]"));
    } catch {
      return new Set();
    }
  });

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from<TodoItem>("todo_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .not("description", "is", null);
    if (data) setTodos(data);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    fetchTodos();

    // Subscribe to realtime updates for this user's tasks
    const channel = supabase
      .channel("global-alarm-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todo_items",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTodos(); // Refetch whenever any task changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodos, user]);

  // Check the alarms against local state every 2 seconds
  useEffect(() => {
    if (!user || todos.length === 0) return;

    // Attach interaction listener to unlock audio on first click
    const unlockAudio = () => initAudio();
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });

    const interval = setInterval(() => {
      const now = new Date();
      
      todos.forEach(t => {
        if (t.due_date && t.description) {
          // Manual parsing to guarantee 100% cross-browser safety (fixes Safari/iOS "Invalid Date")
          const [year, month, day] = t.due_date.split('-').map(Number);
          const [hours, minutes] = t.description.split(':').map(Number);
          const dueDateTime = new Date(year, month - 1, day, hours, minutes);
          
          if (now.getTime() >= dueDateTime.getTime() && !rungAlarms.has(t.id)) {
            // Play sound
            playBellSound();
            
            // Show toast
            toast("Hare Krishna! 🪔 Time for your task!", {
              description: t.title,
              duration: 20000,
            });
            
            // Mark as rung
            setRungAlarms(prev => {
              const newSet = new Set(prev).add(t.id);
              localStorage.setItem("spark_rung_alarms", JSON.stringify(Array.from(newSet)));
              return newSet;
            });
          }
        }
      });
    }, 2000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, [todos, rungAlarms, user]);

  return null;
}
