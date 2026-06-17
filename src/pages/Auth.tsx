import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, ArrowLeft, Sun, Moon } from "lucide-react";
import logo from "@/assets/saksham-logo.png";
import { useTheme } from "next-themes";

const DEVOTEE_LEVELS = [
  { value: "DYS", label: "DYS" },
  { value: "Bhakti Vriksha Level 1", label: "Bhakti Vriksha Level 1 (Target: 2 rounds)" },
  { value: "Bhakti Vriksha Level 2", label: "Bhakti Vriksha Level 2 (Target: 4 rounds)" },
  { value: "Bhakti Vriksha Level 3", label: "Bhakti Vriksha Level 3 (Target: 8 rounds)" },
  { value: "Bhakti Vriksha Level 4", label: "Bhakti Vriksha Level 4 (Target: 16 rounds)" },
  { value: "Initiated", label: "Initiated" },
];

const OPERATORS_VOLUNTEERS= [
  "H.G Sadbhuj Gaur Das",
  "H.G Giridhar Sevak Das",
  "H.G Radha Madhav Devi Mataji",
  "H.G Gauranga Das",
  "H.G Anupama Nimai Das",
  "H.G Murali Chandra Das",
  "Shaswat Prabhuji",
  "H.G Ashraya Gaur Das",
  "Sandhya Mataji",
  "H.G Sudevi Devi Dasi",
  "Swarnakanti Mataji",
  "Narendra Sahu (Narsingh Prabhuji)",
  "Som Bagri Prabhuji",
  "Shreyash Prabhuji",
  "Ankur Prabhuji",
  "Yash Rana Prabhuji",
  "Tushit Prabhuji",
  "Shriram Prabhuji",
  "Shivam Prabhuji",
  "Kartik Prabhuji",
  "Tamanna Mataji",
  "Ankita Mataji",
  "Shraddha Mataji",
  "Shailija Mataji",
];

const TEMPLES = [
  "Iskcon Ayodhya",
  "Iskcon Jankipurram",
  "Saksham",
  "Others"
];

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8, "Min 8 characters").max(72),
  devoteeLevel: z.string().min(1, "Select a level"),
  assignedMentor: z.string().trim().min(2).max(100),
  iskconTemple: z.string().min(1, "Select a temple"),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Required"),
});

type Mode = "tabs" | "forgot-email" | "forgot-otp" | "forgot-reset" | "otp-email" | "otp-verify";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.9 36.1 43.5 30.5 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export default function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");
  const [mode, setMode] = useState<Mode>("tabs");
  const { theme, setTheme } = useTheme();

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // register
  const [reg, setReg] = useState({
    fullName: "", email: "", phone: "", password: "",
    devoteeLevel: "", assignedMentor: "", iskconTemple: "",
  });
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  // otp login
  const [otpEmail, setOtpEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("forgot-reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message || "Google sign-in failed");
      return;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPwd });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ 
      email: parsed.data.email, 
      password: parsed.data.password 
    });
    setLoginLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Hare Krishna! Welcome back 🙏");
    nav("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(reg);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setRegLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          devotee_level: parsed.data.devoteeLevel,
          assigned_mentor: parsed.data.assignedMentor,
          iskcon_temple: parsed.data.iskconTemple,
        },
      },
    });
    setRegLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created 🪔 Welcome!");
    nav("/");
  };

  const sendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.includes("@")) { toast.error("Enter a valid email"); return; }
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: otpEmail.trim() });
    setOtpLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("OTP sent to your email");
    setMode("otp-verify");
  };

  const verifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginOtp.length !== 6) { toast.error("Enter 6-digit code"); return; }
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail.trim(),
      token: loginOtp,
      type: "email",
    });
    setOtpLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Hare Krishna! Welcome back 🙏");
    nav("/");
  };

  // Forgot password flow — uses email OTP recovery
  const sendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes("@")) { toast.error("Enter a valid email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
    setForgotLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("OTP sent to your email");
    setMode("forgot-otp");
  };

  const verifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) { toast.error("Enter 6-digit code"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: forgotEmail,
      token: forgotOtp,
      type: "recovery",
    });
    setForgotLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Verified — set your new password");
    setMode("forgot-reset");
  };

  const submitNewPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) { toast.error("Min 8 characters"); return; }
    if (newPwd !== confirmPwd) { toast.error("Passwords do not match"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setForgotLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated 🪔");
    nav("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4 relative overflow-hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 z-50 rounded-full bg-background/50 backdrop-blur-sm border shadow-sm"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Saksham" className="h-24 w-24 rounded-full ring-4 ring-primary/30 shadow-elegant" />
          <h1 className="font-serif text-4xl mt-4 text-secondary">Saksham Sadhu Sang</h1>
          <p className="text-sm text-muted-foreground italic">"Aapka Saksham Path"</p>
        </div>

        <Card className="glass-card border-0 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              {mode === "tabs" && "Welcome, Devotee"}
              {mode === "forgot-email" && "Forgot Password"}
              {mode === "forgot-otp" && "Verify OTP"}
              {mode === "forgot-reset" && "New Password"}
              {mode === "otp-email" && "Sign in with OTP"}
              {mode === "otp-verify" && "Verify OTP"}
            </CardTitle>
            <CardDescription>
              {mode === "tabs" && "Sign in or begin your spiritual journey"}
              {mode === "forgot-email" && "We'll email you a 6-digit code"}
              {mode === "forgot-otp" && `Enter the code sent to ${forgotEmail}`}
              {mode === "forgot-reset" && "Choose a strong new password"}
              {mode === "otp-email" && "We'll email you a 6-digit code"}
              {mode === "otp-verify" && `Enter the code sent to ${otpEmail}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {mode === "tabs" && (
              <>
                <Button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  variant="outline"
                  className="w-full bg-white/80 hover:bg-white text-foreground border border-border/60 rounded-xl h-11 gap-2 shadow-sm"
                >
                  <GoogleIcon />
                  {googleLoading ? "Connecting…" : "Continue with Google"}
                </Button>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                      <div>
                        <Label>Email</Label>
                        <Input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <div className="relative">
                          <Input
                            type={showLoginPwd ? "text" : "password"}
                            required
                            value={loginPwd}
                            onChange={e => setLoginPwd(e.target.value)}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPwd(v => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle password"
                          >
                            {showLoginPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setForgotEmail(loginEmail); setMode("forgot-email"); }}
                          className="text-xs text-primary hover:underline mt-1.5 inline-block"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Button type="submit" disabled={loginLoading} className="w-full btn-liquid-glass h-11">
                        {loginLoading ? "Signing in…" : "Sign In"}
                      </Button>
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          onClick={() => { setOtpEmail(loginEmail); setMode("otp-email"); }}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Sign in with OTP instead
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-3 mt-4">
                      <div><Label>Full Name</Label>
                        <Input value={reg.fullName} onChange={e => setReg({...reg, fullName: e.target.value})} required /></div>
                      <div><Label>Email</Label>
                        <Input type="email" value={reg.email} onChange={e => setReg({...reg, email: e.target.value})} required /></div>
                      <div><Label>Phone</Label>
                        <Input value={reg.phone} onChange={e => setReg({...reg, phone: e.target.value})} required /></div>
                      <div>
                        <Label>Password (min 8 chars)</Label>
                        <div className="relative">
                          <Input
                            type={showRegPwd ? "text" : "password"}
                            value={reg.password}
                            onChange={e => setReg({...reg, password: e.target.value})}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPwd(v => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle password"
                          >
                            {showRegPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div><Label>Devotee Level</Label>
                        <Select value={reg.devoteeLevel} onValueChange={v => setReg({...reg, devoteeLevel: v})}>
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            {DEVOTEE_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>SPIRITUAL FRIEND</Label>
                        <Select value={reg.assignedMentor} onValueChange={v => setReg({...reg, assignedMentor: v})}>
                          <SelectTrigger><SelectValue placeholder="Select SPIRITUAL FRIEND" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {OPERATORS_VOLUNTEERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>ISKCON Temple</Label>
                        <Select value={reg.iskconTemple} onValueChange={v => setReg({...reg, iskconTemple: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Temple" /></SelectTrigger>
                          <SelectContent>
                            {TEMPLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={regLoading} className="w-full btn-liquid-glass h-11">
                        {regLoading ? "Creating…" : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {mode === "forgot-email" && (
              <form onSubmit={sendForgotOtp} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="pl-9"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full btn-liquid-glass h-11">
                  {forgotLoading ? "Sending…" : "Send OTP"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("tabs")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
                </Button>
              </form>
            )}

            {mode === "forgot-otp" && (
              <form onSubmit={verifyForgotOtp} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={forgotOtp} onChange={setForgotOtp}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full btn-liquid-glass h-11">
                  {forgotLoading ? "Verifying…" : "Verify Code"}
                </Button>
                <button
                  type="button"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={sendForgotOtp as any}
                  className="text-xs text-primary hover:underline w-full text-center"
                >
                  Resend code
                </button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("forgot-email")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Change email
                </Button>
              </form>
            )}

            {mode === "forgot-reset" && (
              <form onSubmit={submitNewPwd} className="space-y-4">
                <div>
                  <Label>New Password</Label>
                  <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full btn-liquid-glass h-11">
                  {forgotLoading ? "Updating…" : "Update Password"}
                </Button>
              </form>
            )}

            {mode === "otp-email" && (
              <form onSubmit={sendLoginOtp} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={e => setOtpEmail(e.target.value)}
                      className="pl-9"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={otpLoading} className="w-full btn-liquid-glass h-11">
                  {otpLoading ? "Sending…" : "Send OTP"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("tabs")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
                </Button>
              </form>
            )}

            {mode === "otp-verify" && (
              <form onSubmit={verifyLoginOtp} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={loginOtp} onChange={setLoginOtp}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" disabled={otpLoading} className="w-full btn-liquid-glass h-11">
                  {otpLoading ? "Verifying…" : "Verify Code"}
                </Button>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <button
                  type="button"
                  onClick={sendLoginOtp as any}
                  className="text-xs text-primary hover:underline w-full text-center"
                >
                  Resend code
                </button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("otp-email")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Change email
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-[11px] text-muted-foreground mt-4 space-y-1 px-2">
          <p>🌿 Inspired by the teachings of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada</p>
          <p className="font-semibold text-secondary">🏛️ A Devotional Initiative under ISKCON Ayodhya</p>
        </div>
      </div>
    </div>
  );
}
