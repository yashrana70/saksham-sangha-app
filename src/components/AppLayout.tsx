import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function AppLayout() {
  const { t } = useI18n();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-soft">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card/60 backdrop-blur px-3 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="ml-3 flex flex-col leading-tight">
              <span className="font-serif text-base md:text-lg">🪔 {t("app_name")}</span>
              <span className="text-[10px] italic text-muted-foreground">"{t("app_tagline")}"</span>
            </div>
            <div className="ml-auto"><LanguageSwitcher compact /></div>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
          <footer className="border-t bg-card/40 backdrop-blur px-4 py-3 text-center text-[11px] text-muted-foreground space-y-0.5">
            <div>{t("inspired_by")}</div>
            <div className="font-medium text-secondary/80">{t("initiative")}</div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
