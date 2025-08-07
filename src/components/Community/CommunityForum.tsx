import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageSquare, Heart, Pin, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  } | null;
  forum_categories?: {
    name: string;
    color: string;
  } | null;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export function CommunityForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category_id: "" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*');
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le categorie",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        profiles (display_name, avatar_url),
        forum_categories (name, color)
      `)
      .eq('is_approved', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq('category_id', selectedCategory);
    }

    const { data, error } = await query;
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i post",
        variant: "destructive",
      });
    } else {
      setPosts((data as any) || []);
    }
    setLoading(false);
  };

  const createPost = async () => {
    if (!newPost.title || !newPost.content || !newPost.category_id) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi richiesti",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per creare un post",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        title: newPost.title,
        content: newPost.content,
        category_id: newPost.category_id,
        author_id: user.id,
        is_approved: false // Moderazione manuale
      });

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile creare il post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Post creato",
        description: "Il tuo post è in attesa di approvazione",
      });
      setNewPost({ title: "", content: "", category_id: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const likePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('forum_likes')
      .insert({ user_id: user.id, post_id: postId });

    if (!error) {
      fetchPosts(); // Ricarica per aggiornare i contatori
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtri e bottone nuovo post */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Tutti
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              style={{ borderColor: category.color }}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Inserisci il titolo del post"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={newPost.category_id} onValueChange={(value) => setNewPost({ ...newPost, category_id: value })}>
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
              <div className="space-y-2">
                <Label htmlFor="content">Contenuto</Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Scrivi il contenuto del tuo post..."
                  rows={6}
                />
              </div>
              <Button onClick={createPost} className="w-full">
                Pubblica Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista dei post */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Caricamento post...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nessun post trovato in questa categoria</p>
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{post.profiles?.display_name || 'Utente'}</h3>
                        {post.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(post.created_at), { 
                          addSuffix: true, 
                          locale: it 
                        })}
                        {post.forum_categories && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: post.forum_categories.color }}
                          >
                            {post.forum_categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <h2 className="font-semibold text-lg mb-2">{post.title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likePost(post.id)}
                      className="flex items-center space-x-1"
                    >
                      <Heart className="h-4 w-4" />
                      <span>{post.likes_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.replies_count}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}