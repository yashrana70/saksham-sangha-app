import { useMemo, useState, useEffect } from "react";
import { BookOpen, Search, Download, Bookmark, BookmarkCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { aartis, Aarti } from "@/lib/aartis";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const CATS = ["all", "morning", "evening", "prayer", "mantra"] as const;

export default function AartiLibrary() {
  const { lang, t } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const [open, setOpen] = useState<Aarti | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("aarti_bookmarks") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("aarti_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return aartis.filter(a => {
      if (cat !== "all" && a.category !== cat) return false;
      if (!ql) return true;
      return a.title.en.toLowerCase().includes(ql)
        || a.title.hi.includes(ql)
        || a.lyrics.en.toLowerCase().includes(ql)
        || a.lyrics.hi.includes(ql);
    });
  }, [q, cat]);

  const toggleBookmark = (id: string) =>
    setBookmarks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id]);

  const handleDownload = (a: Aarti) => {
    if (a.pdfUrl) { window.open(a.pdfUrl, "_blank"); return; }
    // Fallback: download lyrics as .txt
    const blob = new Blob([`${a.title[lang]}\n\n${a.lyrics[lang]}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${a.id}-${lang}.txt`; link.click();
    URL.revokeObjectURL(url);
    toast.info(t("no_pdf_yet"));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl bg-gradient-divine p-6 md:p-8 text-primary-foreground shadow-elegant relative overflow-hidden">
        <Sparkles className="absolute right-6 top-6 opacity-30 h-12 w-12" />
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          <div>
            <h1 className="font-serif text-2xl md:text-3xl">{t("aarti_title")}</h1>
            <p className="text-sm opacity-90 mt-1">{t("aarti_sub")}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t("search")} className="pl-9" />
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tabs value={cat} onValueChange={(v) => setCat(v as any)}>
          <TabsList className="flex-wrap h-auto">
            {CATS.map(c => (
              <TabsTrigger key={c} value={c} className="capitalize">{t(c === "all" ? "all" : c)}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => {
          const marked = bookmarks.includes(a.id);
          return (
            <Card key={a.id} className="border-primary/20 hover:shadow-elegant transition-shadow group overflow-hidden">
              <div className="h-1.5 bg-gradient-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-serif text-lg leading-snug">{a.title[lang]}</CardTitle>
                  <button onClick={() => toggleBookmark(a.id)} className="text-primary/70 hover:text-primary shrink-0" aria-label="Bookmark">
                    {marked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </button>
                </div>
                <Badge variant="secondary" className="w-fit capitalize text-[10px]">{t(a.category)}</Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line font-serif">
                  {a.lyrics[lang]}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => setOpen(a)}>
                    <BookOpen className="h-4 w-4 mr-1" /> {t("read")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(a)} title={t("download_pdf")}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-center">{open.title[lang]}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 p-5 rounded-lg bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border border-primary/20">
                <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground">
                  {open.lyrics[lang]}
                </pre>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleDownload(open)}>
                  <Download className="h-4 w-4 mr-1" /> {t("download_pdf")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
