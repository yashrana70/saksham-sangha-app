import { useState } from "react";
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
import { Heart, MessageSquare, Trash2, Send, ImageIcon, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Community() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [postType, setPostType] = useState("standard");
  const [showImageInput, setShowImageInput] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["community_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          community_likes (id, user_id),
          community_comments (id, content, created_at, user_id, profiles:user_id (id, full_name, avatar_url))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("community_posts").insert({
        user_id: user!.id,
        content: newPostContent,
        image_url: newPostImage || null,
        post_type: postType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
      setNewPostContent("");
      setNewPostImage("");
      setShowImageInput(false);
      setPostType("standard");
      toast({ title: "Post created!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to post", description: error.message, variant: "destructive" });
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
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-serif font-bold text-center mb-8">Devotee Community</h1>

      <Card className="shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <Textarea
              placeholder="Share a realization, kirtan update, or ask a question..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="resize-none border-0 focus-visible:ring-0 text-lg p-0"
              rows={3}
            />
            {showImageInput && (
              <Input
                placeholder="Paste an Image URL here..."
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
              />
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowImageInput(!showImageInput)}>
                  <ImageIcon className="h-5 w-5 mr-2 text-primary" /> Image URL
                </Button>
                {isAdmin && (
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-[140px] h-9">
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
              <Button type="submit" disabled={!newPostContent.trim() || createPostMutation.isPending}>
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {posts?.map((post: any) => {
          const isLiked = post.community_likes.some((like: any) => like.user_id === user?.id);
          const isQnA = post.post_type === "qna";
          const isAnnouncement = post.post_type === "announcement";

          return (
            <Card key={post.id} className={`shadow-sm overflow-hidden ${isQnA ? 'border-amber-400 border-2' : ''} ${isAnnouncement ? 'border-primary border-2' : ''}`}>
              {isQnA && (
                <div className="bg-amber-100 text-amber-800 text-xs font-bold px-4 py-1 flex items-center gap-1 uppercase tracking-wider">
                  <AlertCircle className="h-3 w-3" /> Question & Answer
                </div>
              )}
              {isAnnouncement && (
                <div className="bg-primary/10 text-primary text-xs font-bold px-4 py-1 flex items-center gap-1 uppercase tracking-wider">
                  <AlertCircle className="h-3 w-3" /> Announcement
                </div>
              )}
              <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarImage src={post.profiles?.avatar_url || ""} />
                    <AvatarFallback>{post.profiles?.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.profiles?.full_name || "Unknown Devotee"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {(user?.id === post.user_id || isAdmin) && (
                  <Button variant="ghost" size="icon" onClick={() => deletePostMutation.mutate(post.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-[15px]">{post.content}</p>
                {post.image_url && (
                  <div className="rounded-md overflow-hidden bg-muted">
                    <img src={post.image_url} alt="Post media" className="w-full max-h-[500px] object-contain" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col border-t bg-muted/20 p-2">
                <div className="flex w-full">
                  <Button
                    variant="ghost"
                    className={`flex-1 gap-2 ${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"}`}
                    onClick={() => toggleLikeMutation.mutate({ postId: post.id, isLiked })}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                    {post.community_likes.length} Likes
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-muted-foreground"
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                  >
                    <MessageSquare className="h-5 w-5" />
                    {post.community_comments.length} Comments
                  </Button>
                </div>

                {activeCommentPost === post.id && (
                  <div className="w-full mt-4 space-y-4 px-2 pb-2">
                    {post.community_comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles?.avatar_url || ""} />
                          <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted p-3 rounded-2xl rounded-tl-none text-sm relative group">
                          <p className="font-semibold text-xs mb-1">{comment.profiles?.full_name}</p>
                          <p>{comment.content}</p>
                          {(user?.id === comment.user_id || isAdmin) && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        placeholder="Write a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="rounded-full bg-muted border-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleCreateComment(post.id);
                          }
                        }}
                      />
                      <Button size="icon" className="rounded-full shrink-0" onClick={() => handleCreateComment(post.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
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
