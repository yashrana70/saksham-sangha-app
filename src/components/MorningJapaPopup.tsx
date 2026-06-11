import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

export function MorningJapaPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show once per session
    const hasSeen = sessionStorage.getItem("japa_popup_seen");
    if (!hasSeen) {
      // Slight delay so it doesn't jarringly snap on the exact millisecond of load
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("japa_popup_seen", "true");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary font-serif mb-2">Morning Japa Link</DialogTitle>
          <DialogDescription className="text-base">
            Join the daily morning Japa session!
            <br />
            <span className="font-semibold text-foreground">Time: 4:30 AM - 7:00 AM</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-6 mb-2">
          <Button 
            className="w-full md:w-auto px-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
            size="lg"
            onClick={() => {
              window.open("https://us06web.zoom.us/j/85730590195?pwd=xzJRCn2xFahgtXkhe8z9TwdKZT3qrp.1", "_blank");
              setOpen(false);
            }}
          >
            <Video className="w-5 h-5" />
            Join Zoom Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
