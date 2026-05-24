import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, ChevronDown, UserCircle, Users, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type NodeData = {
  id: string;
  name: string;
  parent_id: string | null;
  role: string;
};

const HierarchyNode = ({ 
  node, 
  nodesMap, 
  level = 0, 
  onEdit,
  isAdmin
}: { 
  node: NodeData, 
  nodesMap: Record<string, NodeData[]>, 
  level?: number,
  onEdit: (node: NodeData) => void,
  isAdmin: boolean
}) => {
  const [expanded, setExpanded] = useState(false);
  const children = nodesMap[node.id] || [];
  
  useEffect(() => {
    if (level === 0) setExpanded(true);
  }, [level]);

  const roleColors: Record<string, string> = {
    admin: "text-red-600 bg-red-100",
    operator: "text-purple-600 bg-purple-100",
    volunteer: "text-blue-600 bg-blue-100",
    devotee: "text-green-600 bg-green-100",
  };

  return (
    <div className="mt-2 select-none">
      <div 
        className={`flex items-center p-3 rounded-lg border transition-colors ${level === 0 ? "bg-muted/20 hover:bg-muted/30" : "bg-card hover:bg-muted/50"}`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div 
          className="w-6 flex items-center justify-center mr-2 text-muted-foreground cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {children.length > 0 ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="w-4" />}
        </div>
        
        {node.role === 'devotee' ? <UserCircle className="h-5 w-5 mr-3 text-muted-foreground" /> : <Users className="h-5 w-5 mr-3 text-primary" />}
        
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="font-medium text-foreground">{node.name}</div>
          <div className="text-xs text-muted-foreground">{children.length} assigned members</div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[node.role] || "text-gray-600 bg-gray-100"}`}>
            {node.role}
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(node)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {expanded && children.length > 0 && (
        <div className="mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {children.map(child => (
            <HierarchyNode key={child.id} node={child} nodesMap={nodesMap} level={level + 1} onEdit={onEdit} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Hierarchy() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [nodesMap, setNodesMap] = useState<Record<string, NodeData[]>>({});
  const [rootNodes, setRootNodes] = useState<NodeData[]>([]);
  const [allNodes, setAllNodes] = useState<NodeData[]>([]);
  
  // Edit State
  const [editingNode, setEditingNode] = useState<NodeData | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editParentId, setEditParentId] = useState<string>("none");
  const [isSaving, setIsSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_hierarchy_tree");
      if (error) throw error;
      
      if (data) {
        const nodes: NodeData[] = data.map(d => ({
          id: d.id,
          name: d.name || "Unknown",
          parent_id: d.parent_id,
          role: d.role || "devotee"
        }));
        
        setAllNodes(nodes);

        const map: Record<string, NodeData[]> = {};
        const roots: NodeData[] = [];
        const allIds = new Set(nodes.map(n => n.id));
        
        nodes.forEach(n => {
          if (n.parent_id && allIds.has(n.parent_id)) {
            if (!map[n.parent_id]) map[n.parent_id] = [];
            map[n.parent_id].push(n);
          } else {
            roots.push(n);
          }
        });

        setNodesMap(map);
        setRootNodes(roots);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load hierarchy data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleEditClick = (node: NodeData) => {
    setEditingNode(node);
    setEditRole(node.role);
    setEditParentId(node.parent_id || "none");
  };

  const handleSave = async () => {
    if (!editingNode) return;
    setIsSaving(true);
    
    try {
      if (editRole !== editingNode.role) {
        if (editRole === "devotee") {
          await supabase.from("user_roles").delete().eq("user_id", editingNode.id);
        } else {
          const { error: roleErr } = await supabase.from("user_roles").upsert({
            user_id: editingNode.id,
            role: editRole as any
          }, { onConflict: "user_id" });
          if (roleErr) throw roleErr;
        }
      }

      const newParent = editParentId === "none" ? null : editParentId;
      if (newParent !== editingNode.parent_id) {
        const { error: profErr } = await supabase.from("profiles").update({
          parent_id: newParent,
          assigned_mentor: newParent ? allNodes.find(n => n.id === newParent)?.name : null
        }).eq("id", editingNode.id);
        if (profErr) throw profErr;
      }

      toast.success(`${editingNode.name} updated successfully!`);
      setEditingNode(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const potentialParents = allNodes.filter(n => n.id !== editingNode?.id && ["admin", "operator", "volunteer", "facilitator"].includes(n.role));

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-primary">Hierarchy & Profiles</h1>
      </div>
      
      <Card className="shadow-elegant border-primary/10">
        <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10 pb-4">
          <CardTitle className="font-serif">Interactive Downline Tree</CardTitle>
          <CardDescription>
            {isAdmin ? "Click the edit icon to change roles and assign devotees under leaders." : "View the organizational structure."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="min-h-[400px]">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading tree...</div>
            ) : rootNodes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No hierarchy data found.</div>
            ) : (
              rootNodes.map(root => (
                <HierarchyNode key={root.id} node={root} nodesMap={nodesMap} onEdit={handleEditClick} isAdmin={isAdmin} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingNode} onOpenChange={(o) => !o && setEditingNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit {editingNode?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assigned Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="devotee">Devotee</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Admins see all. Operators see Volunteers. Volunteers see Devotees.</p>
            </div>

            <div className="space-y-2">
              <Label>Assigned Under (Parent)</Label>
              <Select value={editParentId} onValueChange={setEditParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Parent (Root) --</SelectItem>
                  {potentialParents.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNode(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
