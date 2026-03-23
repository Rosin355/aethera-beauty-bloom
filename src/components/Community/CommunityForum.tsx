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
import { Plus, MessageSquare, Heart, Pin, ThumbsUp, ThumbsDown, Info, Loader2 } from "lucide-react";
import { ForumReplies } from "./ForumReplies";
import { UserTypeBadge } from "./UserTypeBadge";
import { PostMediaUploader, uploadPostMedia } from "./PostMediaUploader";
import { PostMediaDisplay } from "./PostMediaDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface MediaItem {
  type: "image" | "video_embed";
  url: string;
  file?: File;
  thumbnailUrl?: string;
}

interface PostMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
}

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
  media?: PostMedia[];
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
  const [newPostMedia, setNewPostMedia] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

        // Fetch media for each post
        const { data: mediaData } = await supabase
          .from("forum_post_media")
          .select("id, media_type, media_url, thumbnail_url")
          .eq("post_id", post.id)
          .order("sort_order");

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
          media: mediaData || [],
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

    setIsSubmitting(true);

    try {
      // Create the post first
      const { data: postData, error: postError } = await supabase
        .from("forum_posts")
        .insert({
          title: newPost.title,
          content: newPost.content,
          category_id: newPost.category_id,
          author_id: user.id,
          is_approved: isAdmin,
        })
        .select("id")
        .single();

      if (postError) {
        throw postError;
      }

      // Upload media if any
      if (newPostMedia.length > 0 && postData?.id) {
        const { uploadedMedia } = await uploadPostMedia(postData.id, user.id, newPostMedia);
        
        // Insert media records
        if (uploadedMedia.length > 0) {
          const mediaRecords = uploadedMedia.map((m, index) => ({
            post_id: postData.id,
            media_type: m.media_type,
            media_url: m.media_url,
            thumbnail_url: m.thumbnail_url,
            sort_order: index,
          }));

          await supabase.from("forum_post_media").insert(mediaRecords);
        }
      }

      toast({
        title: isAdmin ? "Post pubblicato!" : "Post inviato per moderazione",
        description: isAdmin 
          ? "Il tuo post è stato pubblicato con successo" 
          : "Il tuo post sarà visibile dopo l'approvazione",
      });

      setNewPost({ title: "", content: "", category_id: "" });
      setNewPostMedia([]);
      setIsCreateDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Errore",
        description: "Impossibile creare il post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        {/* Categorie - scrollabile su mobile */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            size="sm"
            className="flex-shrink-0 text-xs sm:text-sm h-8 px-2 sm:px-3"
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
                    className="flex-shrink-0 gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3"
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : undefined,
                      borderColor: category.color,
                    }}
                  >
                    {category.name}
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

        {/* Bottone Nuovo Post */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto self-end text-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Nuovo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Crea un nuovo post</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label className="text-sm">Titolo</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Titolo del post"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Categoria</Label>
                <Select
                  value={newPost.category_id}
                  onValueChange={(value) => setNewPost({ ...newPost, category_id: value })}
                >
                  <SelectTrigger className="text-sm">
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
                <Label className="text-sm">Contenuto</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Scrivi il contenuto del post..."
                  rows={3}
                  className="text-sm"
                />
              </div>
              <PostMediaUploader
                media={newPostMedia}
                onMediaChange={setNewPostMedia}
              />
              <Button onClick={createPost} className="w-full text-sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pubblicazione...
                  </>
                ) : (
                  "Pubblica"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista post */}
      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-sm sm:text-base text-muted-foreground">Caricamento...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Nessun post disponibile</p>
          <p className="text-sm text-muted-foreground">Sii il primo a creare un post!</p>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-3 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-4">
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {post.author_avatar_url ? (
                      <img src={post.author_avatar_url} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium">{post.author_display_name[0]}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base">{post.author_display_name}</span>
                    <UserTypeBadge userType={post.author_user_type} size="sm" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <Badge className="text-xs" style={{ backgroundColor: post.category_color }}>
                      {post.category_name}
                    </Badge>
                    {post.is_pinned && (
                      <Badge variant="outline" className="text-xs">
                        <Pin className="w-2.5 h-2.5 mr-0.5" />
                        Fissato
                      </Badge>
                    )}
                    {!post.is_approved && (
                      <Badge variant="secondary" className="text-xs">In attesa</Badge>
                    )}
                  </div>
                  
                  <h3 
                    className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2 cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/dashboard/community/post/${post.id}`)}
                  >
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-base text-muted-foreground mb-2 line-clamp-2 sm:line-clamp-3">{post.content}</p>
                  
                  {/* Post Media */}
                  {post.media && post.media.length > 0 && (
                    <PostMediaDisplay media={post.media} compact />
                  )}
                  
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap mt-3 sm:mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.id, post.user_has_liked || false)}
                      className="gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {post.likes_count}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/community/post/${post.id}`)}
                      className="gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {post.replies_count}
                    </Button>

                    {isAdmin && (
                      <div className="flex gap-1.5 sm:gap-2 ml-auto flex-wrap">
                        {!post.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderatePost(post.id, 'approve')}
                            className="h-7 px-2 text-xs"
                          >
                            <ThumbsUp className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">Approva</span>
                          </Button>
                        )}
                        {post.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderatePost(post.id, 'reject')}
                            className="h-7 px-2 text-xs"
                          >
                            <ThumbsDown className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">Rifiuta</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moderatePost(post.id, post.is_pinned ? 'unpin' : 'pin')}
                          className="h-7 px-2 text-xs"
                        >
                          <Pin className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">{post.is_pinned ? 'Rimuovi' : 'Fissa'}</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 sm:mt-4">
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