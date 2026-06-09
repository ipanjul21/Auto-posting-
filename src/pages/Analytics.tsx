import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  MousePointerClick,
  Video,
  Facebook,
  Instagram,
  Music,
  AtSign,
} from "lucide-react";
import { PLATFORM_CONFIG, type PlatformType } from "@/const";

const platformIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  threads: AtSign,
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color + "15" }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <p className="text-xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformBreakdown({
  accounts,
}: {
  accounts: {
    id: number;
    platform: PlatformType;
    accountName: string;
    followerCount: number | null;
    isActive: boolean;
  }[];
}) {
  const platforms = ["facebook", "instagram", "tiktok", "threads"] as const;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Platform Breakdown</h3>
      <div className="space-y-3">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const Icon = platformIcons[platform] || Music;
          const platformAccounts = accounts.filter(
            (a) => a.platform === platform
          );
          const totalFollowers = platformAccounts.reduce(
            (sum, a) => sum + (a.followerCount || 0),
            0
          );

          if (platformAccounts.length === 0) return null;

          return (
            <div
              key={platform}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: config.color + "15" }}
                >
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{config.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {platformAccounts.length} account
                    {platformAccounts.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {totalFollowers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">followers</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerformanceChart({
  posts,
}: {
  posts: {
    id: number;
    content: string;
    status: string;
    createdAt: Date;
  }[];
}) {
  // Group posts by date
  const postsByDate = posts.reduce(
    (acc, post) => {
      const date = new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = { published: 0, scheduled: 0, draft: 0 };
      if (post.status === "published") acc[date].published++;
      else if (post.status === "scheduled") acc[date].scheduled++;
      else acc[date].draft++;
      return acc;
    },
    {} as Record<string, { published: number; scheduled: number; draft: number }>
  );

  const dates = Object.keys(postsByDate).slice(-7);
  const maxValue = Math.max(
    ...dates.map((d) =>
      Math.max(
        postsByDate[d].published,
        postsByDate[d].scheduled,
        postsByDate[d].draft
      )
    ),
    1
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Posting Activity (Last 7 Days)</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Published</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm bg-gray-300" />
            <span className="text-muted-foreground">Draft</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2 h-40">
        {dates.map((date) => {
          const data = postsByDate[date];
          const publishedHeight = (data.published / maxValue) * 100;
          const scheduledHeight = (data.scheduled / maxValue) * 100;
          const draftHeight = (data.draft / maxValue) * 100;

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-32">
                {data.published > 0 && (
                  <div
                    className="flex-1 bg-green-500 rounded-t-sm transition-all"
                    style={{ height: `${publishedHeight}%` }}
                    title={`Published: ${data.published}`}
                  />
                )}
                {data.scheduled > 0 && (
                  <div
                    className="flex-1 bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${scheduledHeight}%` }}
                    title={`Scheduled: ${data.scheduled}`}
                  />
                )}
                {data.draft > 0 && (
                  <div
                    className="flex-1 bg-gray-300 rounded-t-sm transition-all"
                    style={{ height: `${draftHeight}%` }}
                    title={`Draft: ${data.draft}`}
                  />
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate w-full text-center">
                {date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } =
    trpc.analytics.aggregatedStats.useQuery();
  const { data: accounts, isLoading: accountsLoading } =
    trpc.socialAccount.list.useQuery();
  const { data: posts, isLoading: postsLoading } = trpc.post.list.useQuery();

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your social media performance and engagement.
          </p>
        </div>

        {/* Overview Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              title="Impressions"
              value={stats?.totalImpressions || 0}
              icon={Eye}
              color="#3b82f6"
            />
            <StatCard
              title="Reach"
              value={stats?.totalReach || 0}
              icon={Users}
              color="#8b5cf6"
            />
            <StatCard
              title="Engagement"
              value={stats?.totalEngagement || 0}
              icon={TrendingUp}
              color="#10b981"
            />
            <StatCard
              title="Likes"
              value={stats?.totalLikes || 0}
              icon={Heart}
              color="#ec4899"
            />
            <StatCard
              title="Comments"
              value={stats?.totalComments || 0}
              icon={MessageCircle}
              color="#f59e0b"
            />
            <StatCard
              title="Shares"
              value={stats?.totalShares || 0}
              icon={Share2}
              color="#6366f1"
            />
            <StatCard
              title="Clicks"
              value={stats?.totalClicks || 0}
              icon={MousePointerClick}
              color="#14b8a6"
            />
            <StatCard
              title="Video Views"
              value={stats?.totalVideoViews || 0}
              icon={Video}
              color="#ef4444"
            />
          </div>
        )}

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posting Activity */}
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <Skeleton className="h-40" />
              ) : posts && posts.length > 0 ? (
                <PerformanceChart posts={posts} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No activity data yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start creating posts to see your activity chart
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Breakdown */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <Skeleton className="h-40" />
              ) : accounts && accounts.length > 0 ? (
                <PlatformBreakdown accounts={accounts} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No accounts connected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Post Performance Table */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-2">
                {posts.slice(0, 10).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium truncate">
                        {post.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        post.status === "published"
                          ? "default"
                          : post.status === "scheduled"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs shrink-0"
                    >
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No posts yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
