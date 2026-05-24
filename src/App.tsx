import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import SplashScreen from "@/components/SplashScreen";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SubmitSadhna from "./pages/SubmitSadhna";
import Reports from "./pages/Reports";
import SadhnaCalendar from "./pages/SadhnaCalendar";
import VaishnavCalendar from "./pages/VaishnavCalendar";
import Admin from "./pages/Admin";
import TodoList from "./pages/TodoList";
import Leaderboard from "./pages/Leaderboard";
import Hierarchy from "./pages/Hierarchy";
import AartiLibrary from "./pages/AartiLibrary";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("splash_shown"));
  const handleSplashDone = () => { sessionStorage.setItem("splash_shown", "1"); setShowSplash(false); };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && <SplashScreen onDone={handleSplashDone} />}
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/index" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/sadhna/new" element={<SubmitSadhna />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/calendar/sadhna" element={<SadhnaCalendar />} />
                  <Route path="/calendar/vaishnav" element={<VaishnavCalendar />} />
                  <Route path="/todo" element={<TodoList />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/hierarchy" element={<Hierarchy />} />
                  <Route path="/aarti" element={<AartiLibrary />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
