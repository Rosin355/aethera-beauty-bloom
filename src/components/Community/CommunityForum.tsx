import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Plus, MessageSquare, Heart, Pin, ThumbsUp, ThumbsDown, Info } from "lucide-react";
import { ForumReplies } from "./ForumReplies";
import { UserTypeBadge } from "./UserTypeBadge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url?: string;
  author_user_type?: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_description?: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_approved: boolean;
  user_has_liked?: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export function CommunityForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category_id: "" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory, user]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('forum-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'forum_posts' 
      }, () => {
        fetchPosts();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'forum_likes'
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, user]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select("id, name, color, description")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const fetchPosts = async () => {
    setLoading(true);
    
    let query = supabase
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
        category_id,
        forum_categories (name, color, description),
        profiles!forum_posts_author_fk (display_name, avatar_url, user_type)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    // Admin vede tutti i post, utenti normali solo quelli approvati o propri
    if (!isAdmin) {
      if (user?.id) {
        query = query.or(`is_approved.eq.true,author_id.eq.${user.id}`);
      } else {
        query = query.eq("is_approved", true);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i post del forum",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Check user likes
    const postsWithLikes = await Promise.all(
      (data as any[]).map(async (post) => {
        let userHasLiked = false;
        if (user) {
          const { data: likeData } = await supabase
            .from("forum_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle();
          userHasLiked = !!likeData;
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author_id: post.author_id,
          author_display_name: post.profiles?.display_name || "Utente Anonimo",
          author_avatar_url: post.profiles?.avatar_url,
          author_user_type: post.profiles?.user_type,
          category_id: post.category_id,
          category_name: post.forum_categories?.name || "Generale",
          category_color: post.forum_categories?.color || "#6AA8B3",
          category_description: post.forum_categories?.description,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          replies_count: post.replies_count || 0,
          is_pinned: post.is_pinned || false,
          is_approved: post.is_approved || false,
          user_has_liked: userHasLiked,
        };
      })
    );

    setPosts(postsWithLikes);
    setLoading(false);
  };

  const createPost = async () => {
    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per creare un post",
        variant: "destructive",
      });
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.category_id) {
      toast({
        title: "Campi mancanti",
        description: "Compila tutti i campi per creare un post",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("forum_posts").insert({
      title: newPost.title,
      content: newPost.content,
      category_id: newPost.category_id,
      author_id: user.id,
      is_approved: isAdmin, // Auto-approva per admin
    });

    if (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Errore",
        description: "Impossibile creare il post",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isAdmin ? "Post pubblicato!" : "Post inviato per moderazione",
      description: isAdmin 
        ? "Il tuo post è stato pubblicato con successo" 
        : "Il tuo post sarà visibile dopo l'approvazione",
    });

    setNewPost({ title: "", content: "", category_id: "" });
    setIsCreateDialogOpen(false);
    fetchPosts();
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
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
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("forum_likes")
        .insert({ post_id: postId, user_id: user.id });
    }

    // Update locale immediato
    setPosts(posts.map(p => 
      p.id === postId 
        ? { 
            ...p, 
            user_has_liked: !currentlyLiked,
            likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1
          }
        : p
    ));
  };

  const moderatePost = async (postId: string, action: 'approve' | 'reject' | 'pin' | 'unpin') => {
    if (!isAdmin) return;

    const updates: any = {};
    if (action === 'approve') updates.is_approved = true;
    if (action === 'reject') updates.is_approved = false;
    if (action === 'pin') updates.is_pinned = true;
    if (action === 'unpin') updates.is_pinned = false;

    const { error } = await supabase
      .from("forum_posts")
      .update(updates)
      .eq("id", postId);

    if (error) {
      console.error("Error moderating post:", error);
      return;
    }

    const messages = {
      approve: "Post approvato",
      reject: "Post rifiutato",
      pin: "Post fissato",
      unpin: "Post rimosso dai fissati"
    };
    
    toast({ title: messages[action] });
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            size="sm"
          >
            Tutti
          </Button>
          <TooltipProvider>
            {categories.map((category) => (
              <Tooltip key={category.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    size="sm"
                    className="gap-1"
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : undefined,
                      borderColor: category.color,
                    }}
                  >
                    {category.name}
                    {category.description && <Info className="h-3 w-3 opacity-60" />}
                  </Button>
                </TooltipTrigger>
                {category.description && (
                  <TooltipContent className="max-w-xs">
                    <p>{category.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea un nuovo post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titolo</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Titolo del post"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={newPost.category_id}
                  onValueChange={(value) => setNewPost({ ...newPost, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contenuto</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Scrivi il contenuto del post..."
                  rows={6}
                />
              </div>
              <Button onClick={createPost} className="w-full">
                Pubblica
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista post */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Nessun post disponibile</p>
          <p className="text-muted-foreground">Sii il primo a creare un post!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {post.author_avatar_url ? (
                      <img src={post.author_avatar_url} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium">{post.author_display_name[0]}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium">{post.author_display_name}</span>
                    <UserTypeBadge userType={post.author_user_type} />
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('it-IT')}
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
                      <Badge variant="secondary">In attesa</Badge>
                    )}
                  </div>
                  
                  <h3 
                    className="text-lg font-semibold mb-2 cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/dashboard/community/post/${post.id}`)}
                  >
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.id, post.user_has_liked || false)}
                      className="gap-2"
                    >
                      <Heart 
                        className={`w-4 h-4 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {post.likes_count}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/community/post/${post.id}`)}
                      className="gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {post.replies_count} risposte
                    </Button>

                    {isAdmin && (
                      <div className="flex gap-2 ml-auto">
                        {!post.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderatePost(post.id, 'approve')}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Approva
                          </Button>
                        )}
                        {post.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderatePost(post.id, 'reject')}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Rifiuta
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moderatePost(post.id, post.is_pinned ? 'unpin' : 'pin')}
                        >
                          <Pin className="w-4 h-4 mr-1" />
                          {post.is_pinned ? 'Rimuovi' : 'Fissa'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <ForumReplies postId={post.id} repliesCount={post.replies_count} onReplyAdded={fetchPosts} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}