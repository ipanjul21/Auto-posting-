import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PenSquare,
  CalendarDays,
  Link2,
  BarChart3,
  ArrowRight,
  Facebook,
  Instagram,
  Music,
  AtSign,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router";
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
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function PlatformCard({
  account,
}: {
  account: {
    id: number;
    platform: PlatformType;
    accountName: string;
    followerCount: number | null;
    isActive: boolean;
  };
}) {
  const config = PLATFORM_CONFIG[account.platform];
  const Icon = platformIcons[account.platform] || Share2;

  return (
    <Card className="border-border/60 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.color + "15" }}
          >
            <Icon className="h-5 w-5" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{account.accountName}</p>
            <p className="text-xs text-muted-foreground">{config.name}</p>
          </div>
          <Badge
            variant={account.isActive ? "default" : "secondary"}
            className="text-xs"
          >
            {account.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        {account.followerCount ? (
          <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{account.followerCount.toLocaleString()} followers</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RecentPostItem({
  post,
}: {
  post: {
    id: number;
    content: string;
    status: string;
    createdAt: Date;
    platforms?: { account: { platform: string } | null }[] | null;
  };
}) {
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    published: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{post.content}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="secondary"
            className={`text-xs ${statusColors[post.status] || ""}`}
          >
            {post.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex -space-x-1">
        {post.platforms?.slice(0, 3).map((p, i) => {
          const platform = p.account?.platform as PlatformType;
          if (!platform) return null;
          const config = PLATFORM_CONFIG[platform];
          const Icon = platformIcons[platform] || Share2;
          return (
            <div
              key={i}
              className="h-6 w-6 rounded-full flex items-center justify-center border-2 border-background"
              style={{ backgroundColor: config.color + "20" }}
            >
              <Icon className="h-3 w-3" style={{ color: config.color }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: accounts, isLoading: accountsLoading } =
    trpc.socialAccount.list.useQuery();
  const { data: postsList, isLoading: postsLoading } = trpc.post.list.useQuery();
  const { data: scheduledList } = trpc.scheduler.list.useQuery();
  const { data: stats } = trpc.analytics.aggregatedStats.useQuery();

  const recentPosts = postsList?.slice(0, 5) || [];
  const activeAccounts = accounts?.filter((a) => a.isActive) || [];
  const pendingScheduled =
    scheduledList?.filter(
      (s) => s.status === "pending" && new Date(s.scheduledAt) > new Date()
    ) || [];

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here's what's happening with your social media accounts.
            </p>
          </div>
          <Button
            onClick={() => navigate("/composer")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <PenSquare className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accountsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))
          ) : (
            <>
              <StatCard
                title="Connected Accounts"
                value={accounts?.length || 0}
                description={`${activeAccounts.length} active accounts`}
                icon={Link2}
                onClick={() => navigate("/accounts")}
              />
              <StatCard
                title="Total Posts"
                value={postsList?.length || 0}
                description="Posts created so far"
                icon={PenSquare}
                onClick={() => navigate("/composer")}
              />
              <StatCard
                title="Scheduled"
                value={pendingScheduled.length}
                description="Upcoming posts"
                icon={CalendarDays}
                onClick={() => navigate("/scheduler")}
              />
              <StatCard
                title="Engagements"
                value={stats?.totalEngagement || 0}
                description="Total interactions"
                icon={BarChart3}
                onClick={() => navigate("/analytics")}
              />
            </>
          )}
        </div>

        {/* Platform Overview & Recent Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connected Platforms */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Connected Accounts</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/accounts")}
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            {accountsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <PlatformCard key={account.id} account={account} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/60">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Link2 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No accounts connected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect your social media accounts to get started
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/accounts")}
                  >
                    Connect Accounts
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Posts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Posts</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/composer")}
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-2">
                {postsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 my-2" />
                  ))
                ) : recentPosts.length > 0 ? (
                  <div className="divide-y">
                    {recentPosts.map((post) => (
                      <RecentPostItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <PenSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No posts yet
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate("/composer")}
                    >
                      Create your first post
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Analytics Preview */}
        {stats && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Performance Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {(stats.totalImpressions || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {(stats.totalLikes || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {(stats.totalComments || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {(stats.totalShares || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
