import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Check, CheckCheck, Search, ArrowLeft, Users, Plus, Info, Trash2, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New Group State
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Profile View/Edit State
  const [showProfile, setShowProfile] = useState(false);
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState("");

  // Fetch all profiles
  const { data: profiles } = useQuery({
    queryKey: ["all_profiles_chat"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const currentUserProfile = profiles?.find(p => p.id === user?.id);
  const otherProfiles = profiles?.filter(p => p.id !== user?.id) || [];

  // Fetch direct messages
  const { data: messages } = useQuery({
    queryKey: ["direct_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select(`*`)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000,
  });

  // Fetch Groups
  const { data: groups } = useQuery({
    queryKey: ["chat_groups"],
    queryFn: async () => {
      if (!user) return [];
      const { data: members, error: memErr } = await supabase
        .from("chat_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      if (memErr) return [];
      if (!members || members.length === 0) return [];
      
      const groupIds = members.map(m => m.group_id);
      const { data: groupsData, error: grpErr } = await supabase
        .from("chat_groups")
        .select("*")
        .in("id", groupIds);
      if (grpErr) return [];
      return groupsData;
    },
    refetchInterval: 3000,
  });

  // Fetch Group Messages
  const { data: groupMessages } = useQuery({
    queryKey: ["group_messages", activeChatId],
    enabled: isGroupChat && !!activeChatId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_messages")
        .select(`*, profiles(full_name, photo_url)`)
        .eq("group_id", activeChatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000,
  });

  // Fetch Cleared Chats Watermarks
  const { data: clearedChats } = useQuery({
    queryKey: ["cleared_chats"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cleared_chats")
        .select("*")
        .eq("user_id", user.id);
      if (error && error.code !== '42P01') throw error; // Ignore if table doesn't exist yet
      return data || [];
    },
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!activeChatId || !newMessage.trim()) return;
      if (isGroupChat) {
        const { error } = await supabase.from("group_messages").insert({
          group_id: activeChatId,
          sender_id: user!.id,
          content: newMessage.trim(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("direct_messages").insert({
          sender_id: user!.id,
          receiver_id: activeChatId,
          content: newMessage.trim(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setNewMessage("");
      if (isGroupChat) queryClient.invalidateQueries({ queryKey: ["group_messages"] });
      else queryClient.invalidateQueries({ queryKey: ["direct_messages"] });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      if (!activeChatId || !user) return;
      const { error } = await supabase.from("cleared_chats").upsert({
        user_id: user.id,
        chat_id: activeChatId,
        cleared_at: new Date().toISOString()
      }, { onConflict: 'user_id, chat_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chat history cleared");
      queryClient.invalidateQueries({ queryKey: ["cleared_chats"] });
    },
    onError: () => toast.error("Failed to clear chat")
  });

  const updateBioMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ bio: editBioText }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setShowEditBio(false);
      toast.success("Bio updated successfully");
      queryClient.invalidateQueries({ queryKey: ["all_profiles_chat"] });
    },
    onError: () => toast.error("Failed to update bio")
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!groupName.trim() || selectedMembers.length === 0) throw new Error("Name and members required");
      
      const { data: group, error: grpErr } = await supabase
        .from("chat_groups")
        .insert({ name: groupName.trim(), created_by: user!.id })
        .select().single();
      if (grpErr) throw grpErr;

      const allMembers = [...selectedMembers, user!.id].map(id => ({
        group_id: group.id,
        user_id: id,
        role: id === user!.id ? "admin" : "member"
      }));
      
      const { error: memErr } = await supabase.from("chat_group_members").insert(allMembers);
      if (memErr) throw memErr;
    },
    onSuccess: () => {
      setShowNewGroup(false);
      setGroupName("");
      setSelectedMembers([]);
      toast.success("Group created!");
      queryClient.invalidateQueries({ queryKey: ["chat_groups"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages, activeChatId]);

  useEffect(() => {
    if (activeChatId && !isGroupChat && messages) {
      const unreadIds = messages
        .filter(m => m.receiver_id === user?.id && m.sender_id === activeChatId && !m.is_read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        supabase.from("direct_messages")
          .update({ is_read: true })
          .in("id", unreadIds)
          .then(() => queryClient.invalidateQueries({ queryKey: ["direct_messages"] }));
      }
    }
  }, [activeChatId, isGroupChat, messages, queryClient, user?.id]);

  // Filtering function to hide messages cleared by the user
  const isMessageVisible = (msg: any, chatId: string) => {
    const watermark = clearedChats?.find((c: any) => c.chat_id === chatId);
    if (!watermark) return true;
    return new Date(msg.created_at) > new Date(watermark.cleared_at);
  };

  const visibleMessages = messages?.filter(m => 
    ((m.sender_id === activeChatId && m.receiver_id === user?.id) || 
     (m.receiver_id === activeChatId && m.sender_id === user?.id)) &&
    isMessageVisible(m, activeChatId!)
  ) || [];

  const visibleGroupMessages = groupMessages?.filter(m => isMessageVisible(m, activeChatId!)) || [];

  const dmConversations = otherProfiles.map(p => {
    const userMsgs = (messages || [])
      .filter(m => (m.sender_id === p.id && m.receiver_id === user?.id) || (m.receiver_id === p.id && m.sender_id === user?.id))
      .filter(m => isMessageVisible(m, p.id));
    
    const lastMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : null;
    const unreadCount = userMsgs.filter(m => m.receiver_id === user?.id && m.sender_id === p.id && !m.is_read).length;
    return { id: p.id, isGroup: false, name: p.full_name, photo: p.photo_url, lastMsg, unreadCount };
  }).filter(c => c.lastMsg || c.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupConversations = (groups || []).map(g => {
    const gMsgs = (groupMessages || [])
      .filter(m => m.group_id === g.id && isMessageVisible(m, g.id));
    const lastMsg = gMsgs.length > 0 ? gMsgs[gMsgs.length - 1] : null;
    return { id: g.id, isGroup: true, name: g.name, photo: null, lastMsg, unreadCount: 0 };
  }).filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const allConversations = [...groupConversations, ...dmConversations].sort((a, b) => {
    if (!a.lastMsg && !b.lastMsg) return 0;
    if (!a.lastMsg) return 1;
    if (!b.lastMsg) return -1;
    return new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime();
  });

  const activeProfile = isGroupChat ? null : otherProfiles.find(p => p.id === activeChatId);
  const activeGroup = isGroupChat ? groups?.find(g => g.id === activeChatId) : null;

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 md:px-4 h-[calc(100vh-100px)]">
      <Card className="h-full flex overflow-hidden shadow-lg border-primary/20 bg-background/50 backdrop-blur-sm rounded-2xl">
        
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r flex flex-col bg-card/40 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-muted/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                <span className="text-primary">💬</span> Chats
              </h2>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditBioText((currentUserProfile as any)?.bio || ""); setShowEditBio(true); }} title="My Profile">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={currentUserProfile?.photo_url || ""} />
                    <AvatarFallback><Edit2 className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowNewGroup(true)}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 bg-background rounded-full border-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {allConversations.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveChatId(c.id); setIsGroupChat(c.isGroup); }}
                className={`w-full text-left p-4 flex items-center gap-3 hover:bg-primary/5 transition-colors border-b border-border/40 ${activeChatId === c.id ? 'bg-primary/10' : ''}`}
              >
                <Avatar className="h-12 w-12 border border-primary/20">
                  {c.isGroup ? <div className="h-full w-full bg-primary/20 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div> : <AvatarImage src={c.photo || ""} />}
                  <AvatarFallback className="bg-primary/10 text-primary">{c.name?.charAt(0) || "D"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold truncate pr-2">{c.name}</span>
                    {c.lastMsg && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(c.lastMsg.created_at), "HH:mm")}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {c.lastMsg ? (
                        <>
                          {!c.isGroup && c.lastMsg.sender_id === user?.id && (
                            <span className="inline-block mr-1">
                              {c.lastMsg.is_read ? <CheckCheck className="h-3 w-3 text-blue-500 inline" /> : <Check className="h-3 w-3 inline" />}
                            </span>
                          )}
                          {c.lastMsg.content}
                        </>
                      ) : (
                        <span className="italic">{c.isGroup ? 'Group Chat' : 'Tap to chat'}</span>
                      )}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-[url('/krishna-chat-bg.png')] bg-repeat bg-center ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChatId ? (
            <>
              {/* Header */}
              <div className="h-16 border-b flex items-center px-4 gap-3 bg-card/90 backdrop-blur-md shadow-sm z-10">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChatId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
                  <Avatar className="h-10 w-10">
                    {isGroupChat ? <div className="h-full w-full bg-primary/20 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div> : <AvatarImage src={activeProfile?.photo_url || ""} />}
                    <AvatarFallback>{isGroupChat ? "G" : activeProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{isGroupChat ? activeGroup?.name : activeProfile?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{isGroupChat ? "Group Chat" : "Tap for info"}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)} title="Info">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm("Clear this chat history? It will only be cleared for you.")) {
                      clearChatMutation.mutate();
                    }
                  }} title="Clear Chat">
                    <Trash2 className="h-5 w-5 text-destructive/80 hover:text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isGroupChat && visibleMessages.map((msg, i, arr) => {
                  const isMine = msg.sender_id === user?.id;
                  const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(arr[i-1].created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full shadow-sm">
                            {format(new Date(msg.created_at), "MMMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border text-card-foreground rounded-tl-sm'}`}>
                          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), "HH:mm")}
                            {isMine && <span>{msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-200" /> : <Check className="h-3 w-3" />}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isGroupChat && visibleGroupMessages.map((msg, i, arr) => {
                  const isMine = msg.sender_id === user?.id;
                  const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(arr[i-1].created_at).toDateString();
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const senderName = (msg as any).profiles?.full_name || "Unknown";
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full shadow-sm">
                            {format(new Date(msg.created_at), "MMMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border text-card-foreground rounded-tl-sm'}`}>
                          {!isMine && <div className="text-xs font-bold text-amber-600 mb-1">{senderName}</div>}
                          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 bg-card/90 backdrop-blur-md border-t flex items-end gap-2">
                <Textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="min-h-[44px] max-h-32 bg-background border-none rounded-2xl resize-none py-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                />
                <Button type="submit" size="icon" className="h-11 w-11 rounded-full shrink-0 bg-primary hover:bg-primary/90 shadow-md" disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                  <Send className="h-5 w-5 ml-1" />
                </Button>
              </form>
            </>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <div className="h-48 w-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg mb-4">
                <img src="/krishna-empty-state.png" alt="Lord Krishna" className="h-full w-full object-cover" />
              </div>
              <p className="font-serif text-2xl text-foreground/80">Saksham Messages</p>
              <p className="text-sm">Select a devotee or group to start chatting</p>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Info Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGroupChat ? "Group Info" : "Devotee Profile"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
              {isGroupChat ? <div className="h-full w-full bg-primary/20 flex items-center justify-center"><Users className="h-12 w-12 text-primary" /></div> : <AvatarImage src={activeProfile?.photo_url || ""} />}
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">{isGroupChat ? "G" : activeProfile?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-serif text-2xl font-bold">{isGroupChat ? activeGroup?.name : activeProfile?.full_name}</h3>
              {!isGroupChat && <p className="text-sm text-primary font-medium uppercase tracking-widest mt-1">{activeProfile?.devotee_level || "Devotee"}</p>}
            </div>
            
            {!isGroupChat && (
              <div className="w-full mt-4 p-4 bg-muted/30 rounded-xl border text-left">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2"><Info className="h-4 w-4"/> Bio</h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{(activeProfile as any)?.bio || "No bio added yet."}</p>
              </div>
            )}
            {isGroupChat && (
              <div className="w-full mt-4 p-4 bg-muted/30 rounded-xl border">
                <p className="text-sm text-muted-foreground">Group ID: {activeGroup?.id}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bio Dialog */}
      <Dialog open={showEditBio} onOpenChange={setShowEditBio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit My Bio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Tell others about yourself:</Label>
            <Textarea 
              value={editBioText} 
              onChange={e => setEditBioText(e.target.value)} 
              placeholder="Hare Krishna! I am..."
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBio(false)}>Cancel</Button>
            <Button onClick={() => updateBioMutation.mutate()} disabled={updateBioMutation.isPending}>Save Bio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Group Name" 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
            />
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
              <p className="text-sm font-semibold mb-2">Select Members:</p>
              {otherProfiles?.map(p => (
                <div key={p.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`member-${p.id}`} 
                    checked={selectedMembers.includes(p.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedMembers([...selectedMembers, p.id]);
                      else setSelectedMembers(selectedMembers.filter(id => id !== p.id));
                    }}
                  />
                  <label htmlFor={`member-${p.id}`} className="text-sm font-medium leading-none cursor-pointer">
                    {p.full_name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroup(false)}>Cancel</Button>
            <Button onClick={() => createGroupMutation.mutate()} disabled={createGroupMutation.isPending || !groupName || selectedMembers.length === 0}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
