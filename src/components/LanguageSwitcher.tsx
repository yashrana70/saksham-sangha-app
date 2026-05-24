import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className="gap-1.5"
      title="Switch language"
    >
      <Languages className="h-4 w-4" />
      {!compact && <span className="font-semibold">{lang === "en" ? "हिन्दी" : "English"}</span>}
      {compact && <span className="text-xs font-semibold">{lang.toUpperCase()}</span>}
    </Button>
  );
}
