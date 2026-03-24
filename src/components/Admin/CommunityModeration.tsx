import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Pin, MessageSquare, Briefcase, MessageCircle, Filter, CheckSquare } from "lucide-react";
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

interface ForumReply {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  is_approved: boolean;
  likes_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
  } | null;
  forum_posts?: {
    title: string;
  } | null;
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Errore sconosciuto";
};

interface DatedItem {
  created_at: string;
}

export function CommunityModeration() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bulk selection states
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectedReplies, setSelectedReplies] = useState<Set<string>>(new Set());
  
  // Filter states
  const [postStatusFilter, setPostStatusFilter] = useState<string>("all");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("all");
  const [replyStatusFilter, setReplyStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    setLoading(true);
    try {
      // Fetch forum posts
      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select(`
          *,
          profiles!forum_posts_author_fk(display_name),
          forum_categories(name, color)
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      setPosts(((postsData || []) as unknown) as ForumPost[]);

      // Fetch job postings
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_postings")
        .select(`
          *,
          profiles!job_postings_posted_by_fk(display_name)
        `)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(((jobsData || []) as unknown) as JobPosting[]);

      // Fetch forum replies
      const { data: repliesData, error: repliesError } = await supabase
        .from("forum_replies")
        .select(`
          *,
          profiles!forum_replies_author_fk(display_name),
          forum_posts(title)
        `)
        .order("created_at", { ascending: false });

      if (repliesError) throw repliesError;
      setReplies(((repliesData || []) as unknown) as ForumReply[]);
    } catch (error: unknown) {
      toast.error("Errore nel caricamento dei contenuti", {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter by date
  const filterByDate = <T extends DatedItem>(items: T[]) => {
    if (dateFilter === "all") return items;
    
    const now = new Date();
    const filtered = items.filter(item => {
      const itemDate = new Date(item.created_at);
      const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch(dateFilter) {
        case "today":
          return diffDays === 0;
        case "week":
          return diffDays <= 7;
        case "month":
          return diffDays <= 30;
        default:
          return true;
      }
    });
    
    return filtered;
  };

  // Bulk approve posts
  const bulkApprovePosts = async () => {
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_approved: true })
        .in("id", Array.from(selectedPosts));

      if (error) throw error;
      toast.success(`${selectedPosts.size} post approvati con successo`);
      setSelectedPosts(new Set());
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nell'approvazione multipla", { description: getErrorMessage(error) });
    }
  };

  // Bulk reject posts
  const bulkRejectPosts = async () => {
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_approved: false })
        .in("id", Array.from(selectedPosts));

      if (error) throw error;
      toast.success(`${selectedPosts.size} post rifiutati`);
      setSelectedPosts(new Set());
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nel rifiuto multiplo", { description: getErrorMessage(error) });
    }
  };

  // Bulk approve jobs
  const bulkApproveJobs = async () => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ is_approved: true })
        .in("id", Array.from(selectedJobs));

      if (error) throw error;
      toast.success(`${selectedJobs.size} annunci approvati con successo`);
      setSelectedJobs(new Set());
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nell'approvazione multipla", { description: getErrorMessage(error) });
    }
  };

  // Bulk reject jobs
  const bulkRejectJobs = async () => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ is_approved: false })
        .in("id", Array.from(selectedJobs));

      if (error) throw error;
      toast.success(`${selectedJobs.size} annunci rifiutati`);
      setSelectedJobs(new Set());
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nel rifiuto multiplo", { description: getErrorMessage(error) });
    }
  };

  // Bulk approve replies
  const bulkApproveReplies = async () => {
    try {
      const { error } = await supabase
        .from("forum_replies")
        .update({ is_approved: true })
        .in("id", Array.from(selectedReplies));

      if (error) throw error;
      toast.success(`${selectedReplies.size} risposte approvate con successo`);
      setSelectedReplies(new Set());
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nell'approvazione multipla", { description: getErrorMessage(error) });
    }
  };

  // Bulk reject replies
  const bulkRejectReplies = async () => {
    try {
      const { error } = await supabase
        .from("forum_replies")
        .update({ is_approved: false })
        .in("id", Array.from(selectedReplies));

      if (error) throw error;
      toast.success(`${selectedReplies.size} risposte rifiutate`);
      setSelectedReplies(new Set());
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nel rifiuto multiplo", { description: getErrorMessage(error) });
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
    } catch (error: unknown) {
      toast.error("Errore nell'approvazione", { description: getErrorMessage(error) });
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
    } catch (error: unknown) {
      toast.error("Errore nel rifiuto", { description: getErrorMessage(error) });
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
    } catch (error: unknown) {
      toast.error("Errore nell'operazione", { description: getErrorMessage(error) });
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
    } catch (error: unknown) {
      toast.error("Errore nell'approvazione", { description: getErrorMessage(error) });
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
    } catch (error: unknown) {
      toast.error("Errore nel rifiuto", { description: getErrorMessage(error) });
    }
  };

  const approveReply = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from("forum_replies")
        .update({ is_approved: true })
        .eq("id", replyId);

      if (error) throw error;
      toast.success("Risposta approvata con successo");
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nell'approvazione", { description: getErrorMessage(error) });
    }
  };

  const rejectReply = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from("forum_replies")
        .update({ is_approved: false })
        .eq("id", replyId);

      if (error) throw error;
      toast.success("Risposta rifiutata");
      fetchPendingContent();
    } catch (error: unknown) {
      toast.error("Errore nel rifiuto", { description: getErrorMessage(error) });
    }
  };

  // Apply filters
  let filteredPosts = posts;
  let filteredJobs = jobs;
  let filteredReplies = replies;

  if (postStatusFilter === "pending") {
    filteredPosts = filteredPosts.filter(p => !p.is_approved);
  } else if (postStatusFilter === "approved") {
    filteredPosts = filteredPosts.filter(p => p.is_approved);
  }

  if (jobStatusFilter === "pending") {
    filteredJobs = filteredJobs.filter(j => !j.is_approved);
  } else if (jobStatusFilter === "approved") {
    filteredJobs = filteredJobs.filter(j => j.is_approved);
  }

  if (replyStatusFilter === "pending") {
    filteredReplies = filteredReplies.filter(r => !r.is_approved);
  } else if (replyStatusFilter === "approved") {
    filteredReplies = filteredReplies.filter(r => r.is_approved);
  }

  filteredPosts = filterByDate(filteredPosts);
  filteredJobs = filterByDate(filteredJobs);
  filteredReplies = filterByDate(filteredReplies);

  const pendingPosts = posts.filter((p) => !p.is_approved);
  const pendingJobs = jobs.filter((j) => !j.is_approved);
  const pendingReplies = replies.filter((r) => !r.is_approved);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri Avanzati
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filtra per Data</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="week">Ultima settimana</SelectItem>
                <SelectItem value="month">Ultimo mese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Post Forum ({pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Risposte ({pendingReplies.length})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Annunci ({pendingJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* POSTS TAB */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="approved">Approvati</SelectItem>
              </SelectContent>
            </Select>

            {selectedPosts.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">{selectedPosts.size} selezionati</Badge>
                <Button size="sm" onClick={bulkApprovePosts}>
                  <Check className="h-4 w-4 mr-1" />
                  Approva Selezionati
                </Button>
                <Button size="sm" variant="destructive" onClick={bulkRejectPosts}>
                  <X className="h-4 w-4 mr-1" />
                  Rifiuta Selezionati
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Caricamento...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nessun post trovato</p>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedPosts.has(post.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedPosts);
                          if (checked) {
                            newSelected.add(post.id);
                          } else {
                            newSelected.delete(post.id);
                          }
                          setSelectedPosts(newSelected);
                        }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{post.title}</h4>
                          {post.is_pinned && (
                            <Badge variant="secondary">
                              <Pin className="h-3 w-3 mr-1" />
                              Fissato
                            </Badge>
                          )}
                          {!post.is_approved && (
                            <Badge variant="outline" className="border-orange-500 text-orange-700">
                              In attesa
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
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Da: {post.profiles?.display_name || "Anonimo"}</span>
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </span>
                          <span>👍 {post.likes_count}</span>
                          <span>💬 {post.replies_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {post.is_approved && (
                          <Button
                            size="sm"
                            variant={post.is_pinned ? "default" : "outline"}
                            onClick={() => togglePinPost(post.id, post.is_pinned)}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                        )}
                        {!post.is_approved && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approvePost(post.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
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
            </div>
          )}
        </TabsContent>

        {/* REPLIES TAB */}
        <TabsContent value="replies" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Select value={replyStatusFilter} onValueChange={setReplyStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="approved">Approvati</SelectItem>
              </SelectContent>
            </Select>

            {selectedReplies.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">{selectedReplies.size} selezionati</Badge>
                <Button size="sm" onClick={bulkApproveReplies}>
                  <Check className="h-4 w-4 mr-1" />
                  Approva Selezionati
                </Button>
                <Button size="sm" variant="destructive" onClick={bulkRejectReplies}>
                  <X className="h-4 w-4 mr-1" />
                  Rifiuta Selezionati
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Caricamento...</p>
          ) : filteredReplies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nessuna risposta trovata</p>
          ) : (
            <div className="space-y-3">
              {filteredReplies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedReplies.has(reply.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedReplies);
                          if (checked) {
                            newSelected.add(reply.id);
                          } else {
                            newSelected.delete(reply.id);
                          }
                          setSelectedReplies(newSelected);
                        }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Risposta a: {reply.forum_posts?.title || "Post eliminato"}
                          </Badge>
                          {!reply.is_approved && (
                            <Badge variant="outline" className="border-orange-500 text-orange-700">
                              In attesa
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{reply.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Da: {reply.profiles?.display_name || "Anonimo"}</span>
                          <span>
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </span>
                          <span>👍 {reply.likes_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!reply.is_approved && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveReply(reply.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectReply(reply.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* JOBS TAB */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="approved">Approvati</SelectItem>
              </SelectContent>
            </Select>

            {selectedJobs.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">{selectedJobs.size} selezionati</Badge>
                <Button size="sm" onClick={bulkApproveJobs}>
                  <Check className="h-4 w-4 mr-1" />
                  Approva Selezionati
                </Button>
                <Button size="sm" variant="destructive" onClick={bulkRejectJobs}>
                  <X className="h-4 w-4 mr-1" />
                  Rifiuta Selezionati
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Caricamento...</p>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nessun annuncio trovato</p>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedJobs.has(job.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedJobs);
                          if (checked) {
                            newSelected.add(job.id);
                          } else {
                            newSelected.delete(job.id);
                          }
                          setSelectedJobs(newSelected);
                        }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{job.title}</h4>
                          {!job.is_approved && (
                            <Badge variant="outline" className="border-orange-500 text-orange-700">
                              In attesa
                            </Badge>
                          )}
                        </div>
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
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(job.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </span>
                          <span>📋 {job.applications_count} candidature</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!job.is_approved && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveJob(job.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
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
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
