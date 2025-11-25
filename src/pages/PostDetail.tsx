import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Heart, MessageSquare, Pin, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url?: string;
  category_name: string;
  category_color: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_approved: boolean;
  user_has_liked: boolean;
}

interface Reply {
  id: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url?: string;
  created_at: string;
  likes_count: number;
  is_approved: boolean;
  user_has_liked: boolean;
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchReplies();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from("forum_posts")
      .select(`
        id,
        title,
        content,
        author_id,
        created_at,
        likes_count,
        replies_count,
        is_pinned,
        is_approved,
        forum_categories (name, color),
        profiles!forum_posts_author_fk (display_name, avatar_url)
      `)
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare il post",
        variant: "destructive",
      });
      return;
    }

    // Check if user liked
    let userHasLiked = false;
    if (user) {
      const { data: likeData } = await supabase
        .from("forum_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      userHasLiked = !!likeData;
    }

    setPost({
      id: data.id,
      title: data.title,
      content: data.content,
      author_id: data.author_id,
      author_display_name: (data.profiles as any)?.display_name || "Utente Anonimo",
      author_avatar_url: (data.profiles as any)?.avatar_url,
      category_name: (data.forum_categories as any)?.name || "Generale",
      category_color: (data.forum_categories as any)?.color || "#6AA8B3",
      created_at: data.created_at,
      likes_count: data.likes_count || 0,
      replies_count: data.replies_count || 0,
      is_pinned: data.is_pinned || false,
      is_approved: data.is_approved || false,
      user_has_liked: userHasLiked,
    });
    setLoading(false);
  };

  const fetchReplies = async () => {
    if (!postId) return;

    let query = supabase
      .from("forum_replies")
      .select(`
        id,
        content,
        author_id,
        created_at,
        likes_count,
        is_approved,
        profiles!forum_replies_author_fk (display_name, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    // Admin vede tutte le risposte, utenti normali solo quelle approvate o proprie
    if (!isAdmin) {
      query = query.or(`is_approved.eq.true,author_id.eq.${user?.id}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    // Check user likes for each reply
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

        return {
          id: reply.id,
          content: reply.content,
          author_id: reply.author_id,
          author_display_name: (reply.profiles as any)?.display_name || "Utente Anonimo",
          author_avatar_url: (reply.profiles as any)?.avatar_url,
          created_at: reply.created_at,
          likes_count: reply.likes_count || 0,
          is_approved: reply.is_approved || false,
          user_has_liked: userHasLiked,
        };
      })
    );

    setReplies(repliesWithLikes);
  };

  const togglePostLike = async () => {
    if (!user || !post) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per mettere like",
        variant: "destructive",
      });
      return;
    }

    if (post.user_has_liked) {
      await supabase
        .from("forum_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("forum_likes")
        .insert({ post_id: post.id, user_id: user.id });
    }

    setPost({
      ...post,
      user_has_liked: !post.user_has_liked,
      likes_count: post.user_has_liked ? post.likes_count - 1 : post.likes_count + 1,
    });
  };

  const toggleReplyLike = async (replyId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per mettere like",
        variant: "destructive",
      });
      return;
    }

    if (currentlyLiked) {
      await supabase
        .from("forum_likes")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("forum_likes")
        .insert({ reply_id: replyId, user_id: user.id });
    }

    setReplies(replies.map(r =>
      r.id === replyId
        ? {
            ...r,
            user_has_liked: !currentlyLiked,
            likes_count: currentlyLiked ? r.likes_count - 1 : r.likes_count + 1,
          }
        : r
    ));
  };

  const submitReply = async () => {
    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per rispondere",
        variant: "destructive",
      });
      return;
    }

    if (!newReply.trim()) {
      toast({
        title: "Contenuto mancante",
        description: "Scrivi qualcosa prima di inviare",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("forum_replies").insert({
      post_id: postId,
      author_id: user.id,
      content: newReply,
      is_approved: isAdmin, // Auto-approva per admin
    });

    if (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Errore",
        description: "Impossibile inviare la risposta",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isAdmin ? "Risposta pubblicata!" : "Risposta inviata per moderazione",
      description: isAdmin
        ? "La tua risposta è stata pubblicata"
        : "La tua risposta sarà visibile dopo l'approvazione",
    });

    setNewReply("");
    fetchReplies();
    if (post) {
      setPost({ ...post, replies_count: post.replies_count + 1 });
    }
  };

  const moderatePost = async (action: 'approve' | 'reject' | 'pin' | 'unpin') => {
    if (!isAdmin || !post) return;

    const updates: any = {};
    if (action === 'approve') updates.is_approved = true;
    if (action === 'reject') updates.is_approved = false;
    if (action === 'pin') updates.is_pinned = true;
    if (action === 'unpin') updates.is_pinned = false;

    const { error } = await supabase
      .from("forum_posts")
      .update(updates)
      .eq("id", post.id);

    if (error) {
      console.error("Error moderating post:", error);
      return;
    }

    toast({ title: `Post ${action === 'approve' ? 'approvato' : action === 'reject' ? 'rifiutato' : action === 'pin' ? 'fissato' : 'rimosso dai fissati'}` });
    fetchPost();
  };

  const moderateReply = async (replyId: string, action: 'approve' | 'reject' | 'delete') => {
    if (!isAdmin) return;

    if (action === 'delete') {
      const { error } = await supabase
        .from("forum_replies")
        .delete()
        .eq("id", replyId);

      if (error) {
        console.error("Error deleting reply:", error);
        return;
      }
      toast({ title: "Risposta eliminata" });
    } else {
      const { error } = await supabase
        .from("forum_replies")
        .update({ is_approved: action === 'approve' })
        .eq("id", replyId);

      if (error) {
        console.error("Error moderating reply:", error);
        return;
      }
      toast({ title: `Risposta ${action === 'approve' ? 'approvata' : 'rifiutata'}` });
    }

    fetchReplies();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Post non trovato</p>
          <Button onClick={() => navigate("/dashboard/community")} className="mt-4">
            Torna al forum
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/community")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al forum
        </Button>

        {/* Post principale */}
        <Card className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {post.author_avatar_url ? (
                  <img src={post.author_avatar_url} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <span className="text-lg font-medium">{post.author_display_name[0]}</span>
                )}
              </div>
            </div>

            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium">{post.author_display_name}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <Badge style={{ backgroundColor: post.category_color }}>
                  {post.category_name}
                </Badge>
                {post.is_pinned && (
                  <Badge variant="outline">
                    <Pin className="w-3 h-3 mr-1" />
                    Fissato
                  </Badge>
                )}
                {!post.is_approved && (
                  <Badge variant="secondary">In attesa di approvazione</Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              <p className="text-foreground whitespace-pre-wrap mb-6">{post.content}</p>

              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePostLike}
                  className="gap-2"
                >
                  <Heart
                    className={`w-4 h-4 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  {post.likes_count}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  {post.replies_count} risposte
                </div>

                {isAdmin && (
                  <div className="flex gap-2 ml-auto">
                    {!post.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moderatePost('approve')}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Approva
                      </Button>
                    )}
                    {post.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moderatePost('reject')}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Rifiuta
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moderatePost(post.is_pinned ? 'unpin' : 'pin')}
                    >
                      <Pin className="w-4 h-4 mr-1" />
                      {post.is_pinned ? 'Rimuovi' : 'Fissa'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Sezione risposte */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Risposte ({replies.length})</h2>

          {/* Form per nuova risposta */}
          <div className="mb-8">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Scrivi una risposta..."
              rows={4}
              className="mb-2"
            />
            <Button onClick={submitReply}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Invia Risposta
            </Button>
          </div>

          {/* Lista risposte */}
          <div className="space-y-6">
            {replies.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessuna risposta ancora. Sii il primo a rispondere!
              </p>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-4 border-l-2 border-primary/20 pl-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {reply.author_avatar_url ? (
                        <img src={reply.author_avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-xs font-medium">{reply.author_display_name[0]}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{reply.author_display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleDateString('it-IT')}
                      </span>
                      {!reply.is_approved && (
                        <Badge variant="secondary" className="text-xs">In attesa</Badge>
                      )}
                    </div>

                    <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{reply.content}</p>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReplyLike(reply.id, reply.user_has_liked)}
                        className="h-7 text-xs"
                      >
                        <Heart
                          className={`w-3 h-3 mr-1 ${reply.user_has_liked ? 'fill-red-500 text-red-500' : ''}`}
                        />
                        {reply.likes_count}
                      </Button>

                      {isAdmin && (
                        <div className="flex gap-2">
                          {!reply.is_approved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moderateReply(reply.id, 'approve')}
                              className="h-7 text-xs"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Approva
                            </Button>
                          )}
                          {reply.is_approved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moderateReply(reply.id, 'reject')}
                              className="h-7 text-xs"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Rifiuta
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moderateReply(reply.id, 'delete')}
                            className="h-7 text-xs text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}