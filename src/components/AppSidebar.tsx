import { NavLink, useLocation } from "react-router-dom";
import { Home, User, BookOpenCheck, BarChart3, Calendar, CalendarDays, LogOut, Shield, ListChecks, Trophy, Network, BookOpen, Sun, Moon, Users, MessageCircle, Heart } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/saksham-logo.png";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const items = [
  { key: "nav_dashboard", url: "/", icon: Home },
  { key: "nav_profile", url: "/profile", icon: User },
  { key: "nav_submit", url: "/sadhna/new", icon: BookOpenCheck },
  { key: "nav_reports", url: "/reports", icon: BarChart3 },
  { key: "nav_sadhna_cal", url: "/calendar/sadhna", icon: Calendar },
  { key: "nav_vaishnav_cal", url: "/calendar/vaishnav", icon: CalendarDays },
  { key: "nav_aarti", url: "/aarti", icon: BookOpen },
  { key: "nav_todo", url: "/todo", icon: ListChecks },
  { key: "nav_leaderboard", url: "/leaderboard", icon: Trophy },
  { key: "nav_hierarchy", url: "/hierarchy", icon: Network },
  { key: "Community", url: "/community", icon: Users },
  { key: "Donation & Books", url: "/donation", icon: Heart },
  { key: "Messages", url: "/messages", icon: MessageCircle },
];

import { useTheme } from "next-themes";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut, session } = useAuth();
  const { isAdmin, isStaff, roleString } = useIsAdmin();
  const { t } = useI18n();
  const handleNav = () => { if (isMobile) setOpenMobile(false); };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2">
          <img src={logo} alt="Saksham logo" className="h-10 w-10 rounded-full ring-2 ring-primary/40 object-cover" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold text-sidebar-foreground">{t("app_name")}</div>
              <div className="text-[10px] italic tracking-wide text-sidebar-foreground/70">"{t("app_tagline")}"</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Devotee Path</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <NavLink to={item.url} end onClick={handleNav} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.key)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                    <NavLink to="/admin" end onClick={handleNav} className="flex items-center gap-3">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Admin Dashboard (App 1)</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isStaff && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={`${import.meta.env.VITE_ADMIN_URL || `https://admin-dashboard-three-rho-69.vercel.app`}?access_token=${session?.access_token || ''}&refresh_token=${session?.refresh_token || ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-purple-600 font-semibold bg-purple-50 hover:bg-purple-100 rounded-md p-2">
                      <ShieldCheck className="h-4 w-4" />
                      {!collapsed && <span>Saksham Connect ({roleString.charAt(0).toUpperCase() + roleString.slice(1)})</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2 w-full">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </Button>
        <Button variant="ghost" size="sm" onClick={signOut}
          className="text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2 w-full">
          <LogOut className="h-4 w-4" />
          {!collapsed && t("sign_out")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
