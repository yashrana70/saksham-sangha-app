import { useState, useEffect } from "react";
import { Heart, ExternalLink, BookOpen, Utensils, CalendarDays, IndianRupee } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function GlobalDonate() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>({
    banner_url: "https://images.unsplash.com/photo-1582610211634-192663eb4c7e?w=800&q=80",
    books_distributed: 5420,
    prasadam_served: 12500,
    events_conducted: 340,
  });

  useEffect(() => {
    async function fetchConfig() {
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'donation_popup_config').maybeSingle();
      if (!error && data?.value) {
        setConfig(data.value);
      }
    }
    fetchConfig();
  }, []);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-[100] md:bottom-8 flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full px-6 py-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105 animate-pulse group border-2 border-amber-200/50"
      >
        <Heart className="w-6 h-6 mr-2 group-hover:animate-bounce" fill="currentColor" />
        <span className="font-bold text-lg tracking-wide drop-shadow-md">Donate</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-amber-200">
          <div className="relative h-56 w-full bg-muted">
            <img 
              src={config.banner_url} 
              alt="ISKCON Ayodhya" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white text-center">
              <h2 className="text-2xl font-serif font-bold text-amber-400 drop-shadow-lg">Support ISKCON Ayodhya</h2>
              <h3 className="text-lg font-serif text-amber-100">& Saksham Seva</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-6 bg-white dark:bg-zinc-950">
            <p className="text-center text-muted-foreground font-medium text-sm">
              Your contribution helps spread Krishna Consciousness, support devotional activities, prasadam distribution, education and community welfare.
            </p>

            <Button 
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg gap-2 rounded-xl"
              onClick={() => window.open("https://rzp.io/rzp/saksham108", "_blank")}
            >
              <Heart className="w-5 h-5 animate-pulse" fill="currentColor" />
              Donate Now via Razorpay
              <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
            </Button>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4">
              <h3 className="font-serif font-bold text-center text-amber-700 dark:text-amber-500 mb-4">Recent Seva Impact</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{config.books_distributed}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Books</div>
                </div>
                <div className="space-y-1">
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{config.prasadam_served}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Meals</div>
                </div>
                <div className="space-y-1">
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{config.events_conducted}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Events</div>
                </div>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground italic">
              "Whatever you do, whatever you eat, whatever you offer or give away... do that, O son of Kunti, as an offering to Me." - BG 9.27
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
