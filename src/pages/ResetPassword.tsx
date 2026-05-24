import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/saksham-logo.png";

export default function ResetPassword() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (pwd !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated 🪔");
    nav("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Saksham" className="h-20 w-20 rounded-full ring-4 ring-primary/30 shadow-elegant" />
          <h1 className="font-serif text-3xl mt-3 text-secondary">Set New Password</h1>
        </div>
        <Card className="glass-card border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Choose a new password</CardTitle>
            <CardDescription>Min 8 characters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full btn-liquid-glass">
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
