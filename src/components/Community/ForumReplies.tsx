import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

interface Reply {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  likes_count: number;
  is_approved: boolean;
  created_at: string;
  user_has_liked: boolean;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface ForumRepliesProps {
  postId: string;
  repliesCount: number;
  onReplyAdded?: () => void;
}

export function ForumReplies({ postId, repliesCount, onReplyAdded }: ForumRepliesProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showReplies) {
      fetchReplies();
    }
  }, [showReplies, postId]);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`
          *,
          profiles!forum_replies_author_fk(display_name, avatar_url)
        `)
        .eq("post_id", postId)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Check user likes
      const repliesWithLikes = await Promise.all(
        (data || []).map(async (reply) => {
          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("forum_likes")
              .select("id")
              .eq("reply_id", reply.id)
              .eq("user_id", user.id)
              .maybeSingle();
            userHasLiked = !!likeData;
          }
          return { ...reply, user_has_liked: userHasLiked };
        })
      );
      
      setReplies(repliesWithLikes as any);
    } catch (error: any) {
      toast.error("Errore nel caricamento delle risposte", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim()) {
      toast.error("Scrivi una risposta prima di inviare");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Devi essere autenticato per rispondere");
        return;
      }

      const { error } = await supabase.from("forum_replies").insert({
        content: newReply,
        author_id: user.id,
        post_id: postId,
        is_approved: false, // Richiede approvazione admin
      });

      if (error) throw error;

      // Update replies count on the post
      const { data: post } = await supabase
        .from("forum_posts")
        .select("replies_count")
        .eq("id", postId)
        .single();

      if (post) {
        await supabase
          .from("forum_posts")
          .update({ replies_count: (post.replies_count || 0) + 1 })
          .eq("id", postId);
      }

      toast.success("Risposta inviata! Sarà visibile dopo l'approvazione.");
      setNewReply("");
      fetchReplies();
      onReplyAdded?.();
    } catch (error: any) {
      toast.error("Errore nell'invio della risposta", {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLikeReply = async (replyId: string, currentlyLiked: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Devi essere autenticato per mettere like");
        return;
      }

      if (currentlyLiked) {
        const { error } = await supabase
          .from("forum_likes")
          .delete()
          .eq("reply_id", replyId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forum_likes")
          .insert({ reply_id: replyId, user_id: user.id });

        if (error) throw error;
      }

      fetchReplies();
    } catch (error: any) {
      toast.error("Errore nell'operazione", { description: error.message });
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowReplies(!showReplies)}
        className="text-muted-foreground hover:text-foreground"
      >
        💬 {repliesCount} {repliesCount === 1 ? "risposta" : "risposte"}
      </Button>

      {showReplies && (
        <div className="space-y-4 pl-4 border-l-2 border-border">
          {loading ? (
            <p className="text-sm text-muted-foreground">Caricamento risposte...</p>
          ) : replies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna risposta ancora. Sii il primo a rispondere!
            </p>
          ) : (
            replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {reply.profiles?.display_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {reply.profiles?.display_name || "Utente"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), {
                            addSuffix: true,
                            locale: it,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{reply.content}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLikeReply(reply.id, reply.user_has_liked)}
                        className="h-7 px-2"
                      >
                        <ThumbsUp className={`h-3 w-3 mr-1 ${reply.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-xs">{reply.likes_count}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Scrivi una risposta..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSubmitReply}
              disabled={submitting || !newReply.trim()}
              size="sm"
            >
              {submitting ? "Invio..." : "Rispondi"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
