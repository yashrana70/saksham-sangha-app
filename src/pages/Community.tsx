import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageSquare, Trash2, Send, ImageIcon, AlertCircle, X as XIcon, BarChart3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CommunityProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type CommunityLike = {
  id: string;
  user_id: string;
};

type CommunityComment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: CommunityProfile | null;
};

type CommunityPollVote = {
  id: string;
  user_id: string;
  option_id: string;
};

type CommunityPollOption = {
  id: string;
  post_id: string;
  option_text: string;
  community_poll_votes: CommunityPollVote[];
};

type CommunityPost = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string | null;
  created_at: string;
  profiles: CommunityProfile | null;
  community_likes: CommunityLike[];
  community_comments: CommunityComment[];
  community_poll_options: CommunityPollOption[];
};

export default function Community() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [postType, setPostType] = useState("standard");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");

  const { data: posts, isLoading } = useQuery<CommunityPost[]>({
    queryKey: ["community_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          community_likes (id, user_id),
          community_comments (id, content, created_at, user_id, profiles:user_id (id, full_name, avatar_url)),
          community_poll_options (id, post_id, option_text, community_poll_votes (id, user_id, option_id))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as CommunityPost[]) ?? [];
    },
  });

  // Real-time fast reloading
  useEffect(() => {
    const channel = supabase.channel("community-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_likes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_poll_votes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      let uploadedImageUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user!.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("community").upload(filePath, selectedFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("community").getPublicUrl(filePath);
        uploadedImageUrl = data.publicUrl;
      }

      const finalPostType = isCreatingPoll ? "poll" : postType;
      const { data: postData, error } = await supabase.from("community_posts").insert({
        user_id: user!.id,
        content: newPostContent,
        image_url: uploadedImageUrl,
        post_type: finalPostType,
      }).select().single();
      if (error) throw error;

      if (isCreatingPoll && postData) {
        const validOptions = pollOptions.filter(opt => opt.trim() !== "");
        if (validOptions.length > 0) {
          const { error: pollError } = await supabase.from("community_poll_options").insert(
            validOptions.map(opt => ({
              post_id: postData.id,
              option_text: opt.trim()
            }))
          );
          if (pollError) throw pollError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      setNewPostContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPostType("standard");
      setIsCreatingPoll(false);
      setPollOptions(["", ""]);
      toast({ title: "Post created!" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Failed to post", description: message, variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      toast({ title: "Post deleted" });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from("community_likes").delete().match({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("community_likes").insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    },
  });

  const votePollMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase.from("community_poll_votes").insert({
        option_id: optionId,
        user_id: user!.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: "You have already voted on this option!", variant: "destructive" });
      } else {
        toast({ title: "Failed to cast vote", description: error.message, variant: "destructive" });
      }
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("community_comments").insert({
        post_id: postId,
        user_id: user!.id,
        content: commentContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      setCommentContent("");
      setActiveCommentPost(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("community_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    createPostMutation.mutate();
  };

  const handleCreateComment = (postId: string) => {
    if (!commentContent.trim()) return;
    createCommentMutation.mutate(postId);
  };

  if (isLoading) return <div className="p-8 text-center">Loading Community Feed...</div>;

  return (
    <div className="max-w-2xl w-full mx-auto py-4 md:py-6 px-2 sm:px-4 space-y-6 overflow-x-hidden">
      <Card className="shadow-sm border border-border bg-card w-full">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/50 rounded-2xl p-2 px-4 flex items-center cursor-text">
              <Textarea
                placeholder="What's on your mind, Devotee?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="resize-none border-0 bg-transparent focus-visible:ring-0 text-base p-0 min-h-[40px] shadow-none w-full"
                rows={newPostContent ? 3 : 1}
              />
            </div>
          </div>
          {selectedFile && (
            <div className="pl-12 pr-2 pb-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-[200px] bg-muted/50 px-2 py-1 rounded-md">{selectedFile.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive" onClick={() => setSelectedFile(null)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {isCreatingPoll && (
            <div className="pt-2 pb-3 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground ml-1">Poll Options</p>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input 
                    placeholder={`Option ${idx + 1}`} 
                    value={opt} 
                    onChange={e => {
                      const newOpts = [...pollOptions];
                      newOpts[idx] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    className="flex-1"
                  />
                  {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9" onClick={() => {
                      setPollOptions(pollOptions.filter((_, i) => i !== idx));
                    }}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <Button variant="outline" size="sm" type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="mt-1">
                  + Add Option
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
            <div className="flex gap-1 flex-wrap">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:bg-muted/50 rounded-lg">
                <ImageIcon className="h-5 w-5 mr-2 text-green-500" /> Photo/Video
              </Button>
              <Button type="button" variant={isCreatingPoll ? "secondary" : "ghost"} size="sm" onClick={() => setIsCreatingPoll(!isCreatingPoll)} className="text-muted-foreground hover:bg-muted/50 rounded-lg">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-500" /> Poll
              </Button>
              {isAdmin && !isCreatingPoll && (
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="w-[140px] h-9 border-0 bg-transparent shadow-none hover:bg-muted/50 text-muted-foreground font-medium">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="qna">Q&A</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button 
              type="submit" 
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() || createPostMutation.isPending}
              className="rounded-lg font-bold px-6"
            >
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {posts?.map(post => {
          const isLiked = post.community_likes.some(like => like.user_id === user?.id);
          const isQnA = post.post_type === "qna";
          const isAnnouncement = post.post_type === "announcement";
          const isPoll = post.post_type === "poll";
          
          let totalVotes = 0;
          let userVotedOptionId: string | null = null;
          if (isPoll && post.community_poll_options) {
            post.community_poll_options.forEach(opt => {
              totalVotes += opt.community_poll_votes?.length || 0;
              if (opt.community_poll_votes?.some(v => v.user_id === user?.id)) {
                userVotedOptionId = opt.id;
              }
            });
          }

          return (
            <Card key={post.id} className={`shadow-sm border bg-card mb-4 ${isQnA ? 'border-amber-400 border-2' : ''} ${isAnnouncement ? 'border-primary border-2' : ''}`}>
              {isQnA && (
                <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold px-4 py-2 flex items-center gap-1 uppercase tracking-wider border-b border-amber-500/20">
                  <AlertCircle className="h-3 w-3" /> Question & Answer
                </div>
              )}
              {isAnnouncement && (
                <div className="bg-primary/5 text-primary text-xs font-bold px-4 py-2 flex items-center gap-1 uppercase tracking-wider border-b border-primary/10">
                  <AlertCircle className="h-3 w-3" /> Announcement
                </div>
              )}
              <CardHeader className="flex flex-row items-start space-y-0 pb-3 pt-4 px-4">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url || ""} />
                    <AvatarFallback>{post.profiles?.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[15px] leading-tight">{post.profiles?.full_name || "Unknown Devotee"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      <span className="text-[10px]">· 🌐</span>
                    </p>
                  </div>
                </div>
                {(user?.id === post.user_id || isAdmin) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                        <span className="text-xl leading-none -mt-2">...</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => deletePostMutation.mutate(post.id)} className="text-destructive font-medium">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4 px-4 pb-2">
                <p className="whitespace-pre-wrap text-[15px] text-foreground font-medium">{post.content}</p>
                {post.image_url && (
                  <div className="rounded-lg overflow-hidden border border-muted -mx-4 mt-3">
                    <img src={post.image_url} alt="Post media" className="w-full object-cover max-h-[600px]" />
                  </div>
                )}
                
                {isPoll && post.community_poll_options && post.community_poll_options.length > 0 && (
                  <div className="mt-4 space-y-2 border rounded-xl p-3 bg-muted/20">
                    <p className="font-semibold text-sm mb-3">Poll Options:</p>
                    {post.community_poll_options.map(opt => {
                      const optVotes = opt.community_poll_votes?.length || 0;
                      const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                      const hasVotedThis = userVotedOptionId === opt.id;
                      
                      return (
                        <div key={opt.id} className="relative group overflow-hidden border rounded-lg hover:border-primary/50 transition-colors">
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-primary/20 transition-all duration-500 ease-out" 
                            style={{ width: `${percent}%` }}
                          />
                          <button
                            disabled={userVotedOptionId !== null || votePollMutation.isPending}
                            onClick={() => votePollMutation.mutate(opt.id)}
                            className="relative w-full text-left px-4 py-2 flex items-center justify-between min-h-[44px] disabled:opacity-100 disabled:cursor-default"
                          >
                            <span className={`font-medium text-sm ${hasVotedThis ? 'font-bold' : ''}`}>
                              {opt.option_text}
                            </span>
                            {(userVotedOptionId !== null) && (
                              <span className="text-xs font-semibold text-muted-foreground ml-2">
                                {percent}% ({optVotes})
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                    <p className="text-xs text-muted-foreground text-right mt-2">{totalVotes} total votes</p>
                  </div>
                )}
                
                {/* Likes/Comments count display */}
                <div className="flex justify-between items-center pt-2 pb-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {post.community_likes.length > 0 && (
                      <>
                        <div className="bg-blue-500 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                          <Heart className="h-3 w-3 fill-white text-white" />
                        </div>
                        <span>{post.community_likes.length}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {post.community_comments.length > 0 && <span>{post.community_comments.length} comments</span>}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col border-t px-4 py-1">
                <div className="flex w-full justify-between items-center">
                  <Button
                    variant="ghost"
                    className={`flex-1 gap-2 rounded-lg py-6 ${isLiked ? "text-blue-600 font-semibold" : "text-muted-foreground font-medium"}`}
                    onClick={() => toggleLikeMutation.mutate({ postId: post.id, isLiked })}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                    Like
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-muted-foreground font-medium rounded-lg py-6"
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                  >
                    <MessageSquare className="h-5 w-5" />
                    Comment
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-muted-foreground font-medium rounded-lg py-6"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.content + "\n\nShared from Saksham Sangha Spark")}`, '_blank')}
                  >
                    <Send className="h-5 w-5" />
                    Share
                  </Button>
                </div>

                {activeCommentPost === post.id && (
                  <div className="w-full mt-2 space-y-4 pb-4 border-t pt-4">
                    {post.community_comments.map((comment: CommunityComment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-8 w-8 mt-1 shrink-0">
                          <AvatarImage src={comment.profiles?.avatar_url || ""} />
                          <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="group relative flex flex-col max-w-[85%]">
                          <div className="bg-muted/70 px-4 py-2 rounded-2xl rounded-tl-sm text-sm inline-block">
                            <p className="font-semibold text-xs leading-tight mb-0.5">{comment.profiles?.full_name}</p>
                            <p className="text-foreground font-medium leading-snug">{comment.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-2 mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                          {(user?.id === comment.user_id || isAdmin) && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="absolute top-2 -right-8 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1.5 rounded-full transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 pt-2">
                      <Avatar className="h-8 w-8 mt-1 shrink-0">
                        <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/50 border rounded-2xl flex items-center pr-1 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all">
                        <Input
                          placeholder="Write a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="bg-transparent border-0 focus-visible:ring-0 shadow-none h-9 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleCreateComment(post.id);
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className={`h-7 w-7 rounded-full shrink-0 ${commentContent.trim() ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground/50'}`}
                          onClick={() => handleCreateComment(post.id)}
                          disabled={!commentContent.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
        {posts?.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No posts yet. Be the first to start the spiritual conversation!
          </div>
        )}
      </div>
    </div>
  );
}
