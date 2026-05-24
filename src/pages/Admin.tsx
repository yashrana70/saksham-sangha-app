import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Shield, Users, Search, BookOpen, ShieldOff, ShieldCheck, Eye, BarChart3, Trash2, Pencil } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

type AdminEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  devotee_name: string | null;
  japa_rounds: number | null;
  hearing_minutes: number | null;
  hearing_topic: string | null;
  reading_minutes: number | null;
  reading_topic: string | null;
  seva_minutes: number | null;
  facilitator_name: string | null;
  notes: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  devotee_level: string | null;
  facilitator_name: string | null;
  spiritual_friend_name: string | null;
  gender: string | null;
  dob: string | null;
  education: string | null;
  profession: string | null;
  marital_status: string | null;
  address: string | null;
  photo_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  family: any;
  created_at: string;
};

type Role = { id: string; user_id: string; role: string };

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleQ, setRoleQ] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (p: Profile) => {
    setEditing(p);
    setEditForm({
      full_name: p.full_name || "",
      email: p.email || "",
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      devotee_level: p.devotee_level || "",
      facilitator_name: p.facilitator_name || "",
      spiritual_friend_name: p.spiritual_friend_name || "",
      gender: p.gender || "",
      dob: p.dob || "",
      address: p.address || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...editForm };
    if (!payload.dob) payload.dob = null;
    const { error } = await supabase.from("profiles").update(payload).eq("id", editing.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Devotee profile updated");
    setEditing(null);
    loadAll();
  };

  const profileMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach(p => { m[p.id] = p; });
    return m;
  }, [profiles]);

  const adminIds = useMemo(
    () => new Set(roles.filter(r => r.role === "admin").map(r => r.user_id)),
    [roles]
  );

  const loadAll = async () => {
    setLoading(true);
    const [{ data: e }, { data: p }, { data: r }] = await Promise.all([
      supabase.from("sadhna_entries").select("*").order("entry_date", { ascending: false }).limit(1000),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEntries((e as any) || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setProfiles((p as any) || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRoles((r as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  const filteredProfiles = useMemo(() => {
    if (!q.trim()) return profiles;
    const n = q.toLowerCase();
    return profiles.filter(p =>
      (p.full_name || "").toLowerCase().includes(n) ||
      (p.email || "").toLowerCase().includes(n) ||
      (p.phone || "").toLowerCase().includes(n) ||
      (p.devotee_level || "").toLowerCase().includes(n) ||
      (p.facilitator_name || "").toLowerCase().includes(n)
    );
  }, [profiles, q]);

  const filteredRoleProfiles = useMemo(() => {
    if (!roleQ.trim()) return profiles;
    const n = roleQ.toLowerCase();
    return profiles.filter(p =>
      (p.full_name || "").toLowerCase().includes(n) ||
      (p.email || "").toLowerCase().includes(n)
    );
  }, [profiles, roleQ]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const inMonth = e.entry_date.startsWith(month);
      if (!inMonth) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      const prof = profileMap[e.user_id];
      return (
        (e.devotee_name || "").toLowerCase().includes(needle) ||
        (prof?.full_name || "").toLowerCase().includes(needle) ||
        (prof?.email || "").toLowerCase().includes(needle) ||
        (e.facilitator_name || "").toLowerCase().includes(needle)
      );
    });
  }, [entries, profileMap, q, month]);

  const stats = useMemo(() => {
    const activeUserIds = new Set(filteredEntries.map(e => e.user_id));
    const rounds = filteredEntries.reduce((s, e) => s + (e.japa_rounds || 0), 0);
    return {
      totalDevotees: profiles.length,
      activeThisMonth: activeUserIds.size,
      monthEntries: filteredEntries.length,
      monthRounds: rounds,
      admins: adminIds.size,
    };
  }, [profiles, filteredEntries, adminIds]);

  const exportSadhnaCSV = () => {
    const headers = [
      "Date", "Devotee Name", "Account Name", "Email", "Devotee Level",
      "Japa Rounds", "Hearing (min)", "Hearing Topic",
      "Reading (min)", "Reading Topic", "Seva (min)", "Facilitator", "Notes",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filteredEntries.map(r => {
      const p = profileMap[r.user_id];
      return [
        r.entry_date, r.devotee_name, p?.full_name, p?.email, p?.devotee_level,
        r.japa_rounds, r.hearing_minutes, r.hearing_topic,
        r.reading_minutes, r.reading_topic, r.seva_minutes, r.facilitator_name, r.notes,
      ].map(escape).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    downloadCSV(csv, `saksham-sadhna-${month}.csv`);
  };

  const exportProfilesCSV = () => {
    const headers = [
      "Full Name", "Email", "Phone", "WhatsApp", "Devotee Level", "Facilitator",
      "Spiritual Friend", "Gender", "DOB", "Marital Status", "Education",
      "Profession", "Address", "Joined",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filteredProfiles.map(p => [
      p.full_name, p.email, p.phone, p.whatsapp, p.devotee_level, p.facilitator_name,
      p.spiritual_friend_name, p.gender, p.dob, p.marital_status, p.education,
      p.profession, p.address, p.created_at?.slice(0, 10),
    ].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    downloadCSV(csv, `saksham-devotees.csv`);
  };

  const downloadCSV = (csv: string, name: string) => {
    try {
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      toast.success(`Downloading ${name}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error("Download failed: " + (err?.message || "unknown"));
    }
  };

  const promote = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) { toast.error(error.message); return; }
    toast.success("Promoted to admin");
    loadAll();
  };

  const demote = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove your own admin role");
      return;
    }
    const { error } = await supabase.from("user_roles").delete()
      .eq("user_id", userId).eq("role", "admin");
    if (error) { toast.error(error.message); return; }
    toast.success("Admin role removed");
    loadAll();
  };

  const removeDevotee = async (userId: string, name: string) => {
    if (userId === user?.id) { toast.error("You cannot remove yourself"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("admin_delete_devotee", { _user_id: userId });
    if (error) { toast.error(error.message); return; }
    toast.success(`${name || "Devotee"} removed`);
    loadAll();
  };

  if (roleLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-soft">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">All devotees' data — admin only</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Users className="h-6 w-6 text-primary" />} label="Devotees" value={stats.totalDevotees} />
        <StatCard icon={<BookOpen className="h-6 w-6 text-primary" />} label={`Active (${month})`} value={stats.activeThisMonth} />
        <StatCard label={`Entries (${month})`} value={stats.monthEntries} />
        <StatCard label="Total Rounds" value={stats.monthRounds} accent />
        <StatCard icon={<ShieldCheck className="h-6 w-6 text-primary" />} label="Admins" value={stats.admins} />
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="devotees">Devotees</TabsTrigger>
          <TabsTrigger value="sadhna">Sadhna Entries</TabsTrigger>
          <TabsTrigger value="roles">Manage Admins</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsPanel
            entries={filteredEntries}
            allEntries={entries}
            profileMap={profileMap}
            month={month}
            setMonth={setMonth}
          />
        </TabsContent>

        {/* Devotees Tab */}
        <TabsContent value="devotees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-serif">All Devotee Profiles</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search name / email / phone…" className="pl-9 w-64" />
                </div>
                <Button onClick={exportProfilesCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Devotee</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Facilitator</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No devotees found.
                      </TableCell></TableRow>
                    )}
                    {filteredProfiles.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={p.photo_url || undefined} />
                              <AvatarFallback>{p.full_name?.[0] || "D"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{p.full_name || "—"}</div>
                              {adminIds.has(p.id) && <Badge variant="secondary" className="mt-0.5 text-[10px]">Admin</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{p.email || "—"}</div>
                          <div className="text-muted-foreground">{p.phone || ""}</div>
                        </TableCell>
                        <TableCell>{p.devotee_level || "—"}</TableCell>
                        <TableCell>{p.facilitator_name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.created_at ? format(parseISO(p.created_at), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setViewing(p)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={p.id === user?.id}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove this devotee?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete <b>{p.full_name || p.email}</b> along with all their sadhna entries and to-do items. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeDevotee(p.id, p.full_name || "")} className="bg-destructive hover:bg-destructive/90">
                                    Remove devotee
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sadhna Tab */}
        <TabsContent value="sadhna">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-serif">All Sadhna Entries</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search…" className="pl-9 w-56" />
                </div>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                  className="border border-input rounded-md px-3 py-1.5 text-sm bg-background h-10" />
                <Button onClick={exportSadhnaCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Devotee</TableHead>
                      <TableHead>Account</TableHead><TableHead>Level</TableHead>
                      <TableHead>Japa</TableHead><TableHead>Hearing</TableHead>
                      <TableHead>Reading</TableHead><TableHead>Seva</TableHead>
                      <TableHead>Facilitator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                        No entries for {month}.
                      </TableCell></TableRow>
                    )}
                    {filteredEntries.map(e => {
                      const p = profileMap[e.user_id];
                      return (
                        <TableRow key={e.id}>
                          <TableCell>{format(parseISO(e.entry_date), "dd MMM")}</TableCell>
                          <TableCell className="font-medium">{e.devotee_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p?.full_name || p?.email || "—"}</TableCell>
                          <TableCell className="text-xs">{p?.devotee_level || "—"}</TableCell>
                          <TableCell className="font-semibold text-primary">{e.japa_rounds || 0}</TableCell>
                          <TableCell>{e.hearing_minutes || 0}m</TableCell>
                          <TableCell>{e.reading_minutes || 0}m</TableCell>
                          <TableCell>{e.seva_minutes || 0}m</TableCell>
                          <TableCell>{e.facilitator_name || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-serif">Manage Admin Access</CardTitle>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={roleQ} onChange={e => setRoleQ(e.target.value)}
                  placeholder="Search devotee…" className="pl-9 w-64" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Promote devotees to admin so they can also view all data. You cannot remove your own admin role.
              </p>
              <div className="space-y-2">
                {filteredRoleProfiles.map(p => {
                  const isUserAdmin = adminIds.has(p.id);
                  const isSelf = p.id === user?.id;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p.photo_url || undefined} />
                          <AvatarFallback>{p.full_name?.[0] || "D"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            {p.full_name || "—"}
                            {isUserAdmin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                            {isSelf && <Badge variant="outline" className="text-[10px]">You</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                        </div>
                      </div>
                      {isUserAdmin ? (
                        <Button size="sm" variant="outline" disabled={isSelf} onClick={() => demote(p.id)}>
                          <ShieldOff className="h-4 w-4 mr-1" /> Remove admin
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => promote(p.id)}>
                          <ShieldCheck className="h-4 w-4 mr-1" /> Make admin
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile detail dialog */}
      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Devotee Profile</DialogTitle>
          </DialogHeader>
          {viewing && <ProfileDetail p={viewing} isAdmin={adminIds.has(viewing.id)} />}
        </DialogContent>
      </Dialog>

      {/* Edit Devotee dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Devotee</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Full Name</Label><Input value={editForm.full_name as string || ""} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={editForm.phone as string || ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={editForm.whatsapp as string || ""} onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })} /></div>
              <div><Label>Devotee Level</Label><Input value={editForm.devotee_level as string || ""} onChange={e => setEditForm({ ...editForm, devotee_level: e.target.value })} /></div>
              <div><Label>Facilitator Name</Label><Input value={editForm.facilitator_name as string || ""} onChange={e => setEditForm({ ...editForm, facilitator_name: e.target.value })} /></div>
              <div><Label>Spiritual Friend</Label><Input value={editForm.spiritual_friend_name as string || ""} onChange={e => setEditForm({ ...editForm, spiritual_friend_name: e.target.value })} /></div>
              <div><Label>Gender</Label><Input value={editForm.gender as string || ""} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} /></div>
              <div><Label>Date of Birth</Label><Input type="date" value={editForm.dob as string || ""} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Input value={editForm.address as string || ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Saving…" : "Save changes"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`text-2xl font-serif ${accent ? "text-primary" : ""}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

function ProfileDetail({ p, isAdmin }: { p: Profile; isAdmin: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fam = (p.family as any) || {};
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 ring-2 ring-primary/30">
          <AvatarImage src={p.photo_url || undefined} />
          <AvatarFallback className="text-2xl font-serif">{p.full_name?.[0] || "D"}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-serif text-xl">{p.full_name || "—"}</div>
          <div className="text-sm text-muted-foreground">{p.spiritual_friend_name}</div>
          {isAdmin && <Badge variant="secondary" className="mt-1">Admin</Badge>}
        </div>
      </div>

      <section>
        <h4 className="font-semibold mb-2">Contact</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" value={p.email} />
          <Field label="Phone" value={p.phone} />
          <Field label="WhatsApp" value={p.whatsapp} />
          <Field label="Address" value={p.address} />
        </div>
      </section>

      <section>
        <h4 className="font-semibold mb-2">Personal</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender" value={p.gender} />
          <Field label="Date of Birth" value={p.dob} />
          <Field label="Marital Status" value={p.marital_status} />
          <Field label="Education" value={p.education} />
          <Field label="Profession" value={p.profession} />
        </div>
      </section>

      <section>
        <h4 className="font-semibold mb-2">Devotional</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Devotee Level" value={p.devotee_level} />
          <Field label="Facilitator" value={p.facilitator_name} />
          <Field label="Spiritual Friend" value={p.spiritual_friend_name} />
        </div>
      </section>

      {(fam.father || fam.mother || (fam.siblings && fam.siblings.length)) && (
        <section>
          <h4 className="font-semibold mb-2">Family</h4>
          <div className="space-y-2 text-sm">
            {fam.father?.name && (
              <div><span className="text-muted-foreground">Father:</span> {fam.father.name}
                {fam.father.occupation && ` • ${fam.father.occupation}`}
                {fam.father.dob && ` • ${fam.father.dob}`}</div>
            )}
            {fam.mother?.name && (
              <div><span className="text-muted-foreground">Mother:</span> {fam.mother.name}
                {fam.mother.occupation && ` • ${fam.mother.occupation}`}
                {fam.mother.dob && ` • ${fam.mother.dob}`}</div>
            )}
            {fam.siblings?.length > 0 && (
              <div>
                <div className="text-muted-foreground">Siblings:</div>
                <ul className="list-disc list-inside">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {fam.siblings.map((s: any, i: number) => (
                    <li key={i}>{s.name}{s.dob && ` • ${s.dob}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function AnalyticsPanel({
  entries, allEntries, profileMap, month, setMonth,
}: {
  entries: AdminEntry[];
  allEntries: AdminEntry[];
  profileMap: Record<string, Profile>;
  month: string;
  setMonth: (m: string) => void;
}) {
  // Daily totals across the selected month
  const dailySeries = useMemo(() => {
    const map = new Map<string, { date: string; rounds: number; hearing: number; reading: number; seva: number }>();
    entries.forEach(e => {
      const k = e.entry_date;
      const cur = map.get(k) || { date: k, rounds: 0, hearing: 0, reading: 0, seva: 0 };
      cur.rounds += e.japa_rounds || 0;
      cur.hearing += e.hearing_minutes || 0;
      cur.reading += e.reading_minutes || 0;
      cur.seva += e.seva_minutes || 0;
      map.set(k, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, label: format(parseISO(d.date), "dd") }));
  }, [entries]);

  // Top devotees by rounds in the month
  const topDevotees = useMemo(() => {
    const totals: Record<string, { name: string; rounds: number; hearing: number; reading: number; seva: number }> = {};
    entries.forEach(e => {
      const p = profileMap[e.user_id];
      const name = e.devotee_name || p?.full_name || p?.email || "Unknown";
      const t = totals[e.user_id] || { name, rounds: 0, hearing: 0, reading: 0, seva: 0 };
      t.rounds += e.japa_rounds || 0;
      t.hearing += e.hearing_minutes || 0;
      t.reading += e.reading_minutes || 0;
      t.seva += e.seva_minutes || 0;
      totals[e.user_id] = t;
    });
    return Object.values(totals).sort((a, b) => b.rounds - a.rounds).slice(0, 8);
  }, [entries, profileMap]);

  // Devotee level distribution from sadhna entries (by user)
  const levelDistribution = useMemo(() => {
    const seen = new Set<string>();
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      if (seen.has(e.user_id)) return;
      seen.add(e.user_id);
      const lvl = profileMap[e.user_id]?.devotee_level || "Unknown";
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries, profileMap]);

  // 6-month trend
  const sixMonthTrend = useMemo(() => {
    const map = new Map<string, { month: string; rounds: number; entries: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = format(d, "yyyy-MM");
      map.set(k, { month: format(d, "MMM"), rounds: 0, entries: 0 });
    }
    allEntries.forEach(e => {
      const k = e.entry_date.slice(0, 7);
      const cur = map.get(k);
      if (!cur) return;
      cur.rounds += e.japa_rounds || 0;
      cur.entries += 1;
    });
    return Array.from(map.values());
  }, [allEntries]);

  const totals = useMemo(() => entries.reduce(
    (s, e) => ({
      rounds: s.rounds + (e.japa_rounds || 0),
      hearing: s.hearing + (e.hearing_minutes || 0),
      reading: s.reading + (e.reading_minutes || 0),
      seva: s.seva + (e.seva_minutes || 0),
    }),
    { rounds: 0, hearing: 0, reading: 0, seva: 0 }
  ), [entries]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="font-serif flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Sadhna Analytics
          </CardTitle>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background h-10"
          />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Total Japa Rounds" value={totals.rounds} accent />
          <MiniStat label="Hearing (min)" value={totals.hearing} />
          <MiniStat label="Reading (min)" value={totals.reading} />
          <MiniStat label="Seva (min)" value={totals.seva} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Daily Japa Rounds — {month}</CardTitle></CardHeader>
          <CardContent className="h-72">
            {dailySeries.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data for this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="rounds" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Daily Hearing / Reading / Seva (min)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {dailySeries.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data for this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="hearing" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="reading" stackId="a" fill="hsl(var(--secondary))" />
                  <Bar dataKey="seva" stackId="a" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Top Devotees by Rounds</CardTitle></CardHeader>
          <CardContent className="h-80">
            {topDevotees.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data for this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDevotees} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} stroke="hsl(var(--muted-foreground))" />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="rounds" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Active Devotees by Level</CardTitle></CardHeader>
          <CardContent className="h-80">
            {levelDistribution.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data for this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => `${entry.name} (${entry.value})`}
                  >
                    {levelDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-serif text-lg">6-Month Sadhna Trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sixMonthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="rounds" name="Total Rounds" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="entries" name="Entries" stroke="hsl(var(--secondary))" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-serif ${accent ? "text-primary" : ""}`}>{value.toLocaleString()}</div>
    </div>
  );
}

