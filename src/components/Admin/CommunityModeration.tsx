import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Pin, Trash2, MessageSquare, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  is_approved: boolean;
  is_pinned: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
  } | null;
  forum_categories?: {
    name: string;
    color: string;
  } | null;
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_range: string;
  is_approved: boolean;
  is_active: boolean;
  applications_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
  } | null;
}

export function CommunityModeration() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    setLoading(true);
    try {
      // Fetch pending forum posts
      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select(`
          *,
          profiles!forum_posts_author_fk(display_name),
          forum_categories(name, color)
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      setPosts((postsData || []) as any);

      // Fetch pending job postings
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_postings")
        .select(`
          *,
          profiles!job_postings_posted_by_fk(display_name)
        `)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs((jobsData || []) as any);
    } catch (error: any) {
      toast.error("Errore nel caricamento dei contenuti", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const approvePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_approved: true })
        .eq("id", postId);

      if (error) throw error;
      toast.success("Post approvato con successo");
      fetchPendingContent();
    } catch (error: any) {
      toast.error("Errore nell'approvazione", { description: error.message });
    }
  };

  const rejectPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_approved: false })
        .eq("id", postId);

      if (error) throw error;
      toast.success("Post rifiutato");
      fetchPendingContent();
    } catch (error: any) {
      toast.error("Errore nel rifiuto", { description: error.message });
    }
  };

  const togglePinPost = async (postId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_pinned: !currentPinned })
        .eq("id", postId);

      if (error) throw error;
      toast.success(currentPinned ? "Post rimosso dai fissati" : "Post fissato in alto");
      fetchPendingContent();
    } catch (error: any) {
      toast.error("Errore nell'operazione", { description: error.message });
    }
  };

  const approveJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ is_approved: true })
        .eq("id", jobId);

      if (error) throw error;
      toast.success("Annuncio approvato con successo");
      fetchPendingContent();
    } catch (error: any) {
      toast.error("Errore nell'approvazione", { description: error.message });
    }
  };

  const rejectJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ is_approved: false })
        .eq("id", jobId);

      if (error) throw error;
      toast.success("Annuncio rifiutato");
      fetchPendingContent();
    } catch (error: any) {
      toast.error("Errore nel rifiuto", { description: error.message });
    }
  };

  const pendingPosts = posts.filter((p) => !p.is_approved);
  const approvedPosts = posts.filter((p) => p.is_approved);
  const pendingJobs = jobs.filter((j) => !j.is_approved);
  const approvedJobs = jobs.filter((j) => j.is_approved);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Post Forum ({pendingPosts.length} in attesa)
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Annunci Lavoro ({pendingJobs.length} in attesa)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {pendingPosts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900">In Attesa di Approvazione</CardTitle>
                <CardDescription className="text-orange-700">
                  {pendingPosts.length} post in attesa di moderazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingPosts.map((post) => (
                  <Card key={post.id} className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{post.title}</h4>
                            {post.forum_categories && (
                              <Badge
                                style={{ backgroundColor: post.forum_categories.color }}
                                className="text-white"
                              >
                                {post.forum_categories.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Da: {post.profiles?.display_name || "Anonimo"}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                                locale: it,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approvePost(post.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectPost(post.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Post Approvati</CardTitle>
              <CardDescription>
                Gestisci i post già approvati
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Caricamento...</p>
              ) : approvedPosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun post approvato
                </p>
              ) : (
                approvedPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{post.title}</h4>
                            {post.is_pinned && (
                              <Badge variant="secondary">
                                <Pin className="h-3 w-3 mr-1" />
                                Fissato
                              </Badge>
                            )}
                            {post.forum_categories && (
                              <Badge
                                style={{ backgroundColor: post.forum_categories.color }}
                                className="text-white"
                              >
                                {post.forum_categories.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>👍 {post.likes_count}</span>
                            <span>💬 {post.replies_count} risposte</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={post.is_pinned ? "default" : "outline"}
                            onClick={() => togglePinPost(post.id, post.is_pinned)}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectPost(post.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {pendingJobs.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900">In Attesa di Approvazione</CardTitle>
                <CardDescription className="text-orange-700">
                  {pendingJobs.length} annunci in attesa di moderazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingJobs.map((job) => (
                  <Card key={job.id} className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-foreground">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.company_name} • {job.location}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{job.job_type}</Badge>
                            {job.salary_range && (
                              <Badge variant="secondary">{job.salary_range}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Pubblicato{" "}
                            {formatDistanceToNow(new Date(job.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveJob(job.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectJob(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Annunci Approvati</CardTitle>
              <CardDescription>
                Annunci di lavoro già approvati
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Caricamento...</p>
              ) : approvedJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun annuncio approvato
                </p>
              ) : (
                approvedJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-foreground">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.company_name} • {job.location}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>📋 {job.applications_count} candidature</span>
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "Attivo" : "Inattivo"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectJob(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
