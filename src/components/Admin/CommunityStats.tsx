import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, TrendingUp, Activity, ThumbsUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Stats {
  totalPosts: number;
  totalUsers: number;
  totalReplies: number;
  totalLikes: number;
  avgEngagement: number;
  activeUsers30d: number;
}

interface TopPost {
  id: string;
  title: string;
  author_name: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
}

interface RecentModeration {
  id: string;
  title: string;
  type: 'post' | 'job';
  action: string;
  timestamp: string;
}

interface TopPostQuery {
  id: string;
  title: string;
  likes_count: number | null;
  replies_count: number | null;
  created_at: string;
  profiles?: { display_name?: string | null } | null;
}

interface RecentPostQuery {
  id: string;
  title: string;
  updated_at: string;
}

export function CommunityStats() {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    totalUsers: 0,
    totalReplies: 0,
    totalLikes: 0,
    avgEngagement: 0,
    activeUsers30d: 0,
  });
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [recentModerations, setRecentModerations] = useState<RecentModeration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      // Total posts
      const { count: postsCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true });

      // Total users with profiles
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total replies
      const { count: repliesCount } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true });

      // Total likes
      const { count: likesCount } = await supabase
        .from('forum_likes')
        .select('*', { count: 'exact', head: true });

      // Active users in last 30 days (users who created posts or replies)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activePosts } = await supabase
        .from('forum_posts')
        .select('author_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: activeReplies } = await supabase
        .from('forum_replies')
        .select('author_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const activeUserIds = new Set([
        ...(activePosts || []).map(p => p.author_id),
        ...(activeReplies || []).map(r => r.author_id),
      ]);

      // Calculate engagement rate (likes + replies per post)
      const avgEngagement = postsCount && postsCount > 0
        ? ((likesCount || 0) + (repliesCount || 0)) / postsCount
        : 0;

      setStats({
        totalPosts: postsCount || 0,
        totalUsers: usersCount || 0,
        totalReplies: repliesCount || 0,
        totalLikes: likesCount || 0,
        avgEngagement: Math.round(avgEngagement * 10) / 10,
        activeUsers30d: activeUserIds.size,
      });

      // Fetch top posts
      const { data: topPostsData } = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          likes_count,
          replies_count,
          created_at,
          profiles!forum_posts_author_fk(display_name)
        `)
        .eq('is_approved', true)
        .order('likes_count', { ascending: false })
        .limit(5);

      setTopPosts(
        ((topPostsData || []) as TopPostQuery[]).map((post) => ({
          id: post.id,
          title: post.title,
          author_name: post.profiles?.display_name || 'Anonimo',
          likes_count: post.likes_count || 0,
          replies_count: post.replies_count || 0,
          created_at: post.created_at,
        }))
      );

      // Fetch recent moderations (approved posts from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentPosts } = await supabase
        .from('forum_posts')
        .select('id, title, updated_at, is_approved')
        .eq('is_approved', true)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      setRecentModerations(
        ((recentPosts || []) as RecentPostQuery[]).map((post) => ({
          id: post.id,
          title: post.title,
          type: 'post' as const,
          action: 'Approvato',
          timestamp: post.updated_at,
        }))
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Caricamento statistiche...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Post</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              Post pubblicati nella community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers30d}</div>
            <p className="text-xs text-muted-foreground">
              Ultimi 30 giorni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagement}</div>
            <p className="text-xs text-muted-foreground">
              Media interazioni per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Risposte</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReplies}</div>
            <p className="text-xs text-muted-foreground">
              Risposte nella community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Like</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              Like ricevuti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Registrati</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Profili creati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="top-posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top-posts">Post Più Popolari</TabsTrigger>
          <TabsTrigger value="moderation">Moderazione Recente</TabsTrigger>
        </TabsList>

        <TabsContent value="top-posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Post per Like</CardTitle>
              <CardDescription>
                I post con più interazioni della community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun post ancora
                </p>
              ) : (
                <div className="space-y-4">
                  {topPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{post.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          di {post.author_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>❤️ {post.likes_count} like</span>
                          <span>💬 {post.replies_count} risposte</span>
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attività di Moderazione</CardTitle>
              <CardDescription>
                Ultimi contenuti moderati (ultimi 7 giorni)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentModerations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessuna attività recente
                </p>
              ) : (
                <div className="space-y-3">
                  {recentModerations.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-start justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {mod.type === 'post' ? 'Post' : 'Lavoro'}
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            {mod.action}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium line-clamp-1">
                          {mod.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-4">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(mod.timestamp), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
