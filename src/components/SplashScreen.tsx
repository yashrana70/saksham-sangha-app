import { useEffect, useState } from "react";
import logo from "@/assets/saksham-logo.png";
import { useI18n } from "@/lib/i18n";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2200);
    const t2 = setTimeout(onDone, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{
        background:
          "radial-gradient(circle at 50% 30%, hsl(28 92% 52% / 0.35), transparent 60%), linear-gradient(180deg, hsl(220 55% 10%), hsl(28 60% 18%))",
      }}
    >
      {/* Glowing particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-yellow-200/60 blur-sm animate-[float_6s_ease-in-out_infinite]"
            style={{
              width: `${4 + (i % 4) * 3}px`,
              height: `${4 + (i % 4) * 3}px`,
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 6) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <img
        src={logo}
        alt="Saksham"
        className="h-28 w-28 rounded-full ring-4 ring-yellow-300/50 shadow-[0_0_60px_rgba(255,180,80,0.55)] animate-[scale-in_0.8s_ease-out]"
      />
      <h1 className="mt-6 font-serif text-3xl md:text-4xl tracking-wide text-yellow-100 animate-[fade-in_0.9s_ease-out] drop-shadow-lg">
        {t("app_name")}
      </h1>
      <p className="mt-2 italic text-yellow-200/80 animate-[fade-in_1.4s_ease-out]">
        "{t("app_tagline")}"
      </p>

      <p className="mt-6 max-w-xs text-center text-xs text-yellow-100/80 animate-[fade-in_1.8s_ease-out] px-6">
        {t("initiative")}
      </p>

      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-yellow-300/80 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-14px) }
        }
      `}</style>
    </div>
  );
}
