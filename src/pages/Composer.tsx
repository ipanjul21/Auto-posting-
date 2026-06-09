import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Facebook,
  Instagram,
  Music,
  AtSign,
  Send,
  Save,
  CalendarClock,
  ImagePlus,
  X,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PLATFORM_CONFIG, type PlatformType } from "@/const";
import { useNavigate } from "react-router";

const platformIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  threads: AtSign,
};

function PlatformSelector({
  accounts,
  selected,
  onToggle,
}: {
  accounts: { id: number; platform: string; accountName: string; isActive: boolean }[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const grouped = accounts.reduce(
    (acc, account) => {
      if (!acc[account.platform]) acc[account.platform] = [];
      acc[account.platform].push(account);
      return acc;
    },
    {} as Record<string, typeof accounts>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Select Platforms</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(-1)}
            className="h-7 text-xs"
          >
            {selected.length === accounts.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(grouped).map(([platform, platformAccounts]) => {
          const config = PLATFORM_CONFIG[platform as PlatformType];
          const Icon = platformIcons[platform] || Music;

          return (
            <Card key={platform} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: config.color + "15" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {platformAccounts.map((account) => {
                  const isSelected = selected.includes(account.id);
                  return (
                    <button
                      key={account.id}
                      onClick={() => onToggle(account.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-border/60 hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm truncate">
                          {account.accountName}
                        </span>
                      </div>
                      <Badge
                        variant={account.isActive ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PostPreview({
  content,
  selectedIds,
  accounts,
}: {
  content: string;
  selectedIds: number[];
  accounts: { id: number; platform: string; accountName: string }[];
}) {
  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Preview</h3>
      <Card className="border-border/60 bg-gray-50/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Your Account</span>
                <span className="text-xs text-muted-foreground">
                  Just now
                </span>
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">
                {content || "Your post content will appear here..."}
              </p>
            </div>
          </div>

          {selectedAccounts.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  Posting to:
                </span>
                {selectedAccounts.map((account) => {
                  const config = PLATFORM_CONFIG[account.platform as PlatformType];
                  const Icon = platformIcons[account.platform] || Music;
                  return (
                    <Badge
                      key={account.id}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                      style={{
                        backgroundColor: config.color + "15",
                        color: config.color,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      {config.name}
                    </Badge>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PublishResults({
  results,
}: {
  results: Array<{
    platform: string;
    accountId: number;
    success: boolean;
    platformPostId?: string;
    postUrl?: string;
    error?: string;
  }>;
}) {
  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium">Publish Results</h3>
      <div className="space-y-2">
        {results.map((result, i) => {
          const config = PLATFORM_CONFIG[result.platform as PlatformType];
          const Icon = platformIcons[result.platform] || Music;
          return (
            <Card
              key={i}
              className={`border-border/60 ${
                result.success ? "bg-green-50/50" : "bg-red-50/50"
              }`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: result.success
                      ? config.color + "15"
                      : "#fee2e2",
                  }}
                >
                  {result.success ? (
                    <Icon
                      className="h-4 w-4"
                      style={{ color: config.color }}
                    />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {config?.name || result.platform}
                  </p>
                  {result.success ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Published successfully
                    </p>
                  ) : (
                    <p className="text-xs text-red-600">
                      {result.error || "Failed to publish"}
                    </p>
                  )}
                </div>
                {result.postUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => window.open(result.postUrl, "_blank")}
                  >
                    View
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Composer() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishResults, setPublishResults] = useState<
    Array<{
      platform: string;
      accountId: number;
      success: boolean;
      platformPostId?: string;
      postUrl?: string;
      error?: string;
    }> | null
  >(null);

  const { data: accounts, isLoading: accountsLoading } =
    trpc.socialAccount.list.useQuery();

  const createPost = trpc.post.create.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to create post");
    },
  });

  const publishPost = trpc.publish.now.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to publish post");
    },
  });

  const createSchedule = trpc.scheduler.create.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      toast.success("Post scheduled successfully!");
      setContent("");
      setSelectedPlatforms([]);
      setMediaUrls([]);
      setPublishResults(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to schedule post");
    },
  });

  const handleTogglePlatform = (id: number) => {
    if (id === -1) {
      if (selectedPlatforms.length === (accounts?.length || 0)) {
        setSelectedPlatforms([]);
      } else {
        setSelectedPlatforms(accounts?.map((a) => a.id) || []);
      }
      return;
    }
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    setIsSubmitting(true);
    setPublishResults(null);
    await createPost.mutateAsync({
      content,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      platformAccountIds: selectedPlatforms.length > 0 ? selectedPlatforms : [],
      status: "draft",
    });
    toast.success("Draft saved!");
    setContent("");
    setSelectedPlatforms([]);
    setMediaUrls([]);
    setIsSubmitting(false);
  };

  const handlePublishNow = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    setIsSubmitting(true);
    setPublishResults(null);

    try {
      // First create the post
      const post = await createPost.mutateAsync({
        content,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        platformAccountIds: selectedPlatforms,
        status: "published",
      });

      if (post) {
        // Then publish to platforms
        const result = await publishPost.mutateAsync({ postId: post.id });
        setPublishResults(result.results);
        utils.post.list.invalidate();
        utils.analytics.aggregatedStats.invalidate();

        if (result.success) {
          toast.success("Published to all platforms!");
        } else {
          toast.warning("Some platforms failed to publish");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);
    setIsSubmitting(true);
    setPublishResults(null);

    try {
      const post = await createPost.mutateAsync({
        content,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        platformAccountIds: selectedPlatforms,
        status: "scheduled",
      });

      if (post) {
        await createSchedule.mutateAsync({
          postId: post.id,
          scheduledAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMedia = () => {
    const demoUrls = [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600",
      "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=600",
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600",
    ];
    const randomUrl = demoUrls[Math.floor(Math.random() * demoUrls.length)];
    if (!mediaUrls.includes(randomUrl)) {
      setMediaUrls([...mediaUrls, randomUrl]);
    }
  };

  const handleRemoveMedia = (url: string) => {
    setMediaUrls(mediaUrls.filter((u) => u !== url));
  };

  if (accountsLoading) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Composer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and publish posts to your social media accounts.
          </p>
        </div>

        {(!accounts || accounts.length === 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  No accounts connected
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Connect at least one social media account before creating posts.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() => navigate("/accounts")}
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Post Content</label>
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={2200}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {content.length > 0
                    ? `Approximately ${Math.ceil(content.length / 280)} tweet${
                        Math.ceil(content.length / 280) > 1 ? "s" : ""
                      }`
                    : "Start typing..."}
                </span>
                <span>{content.length}/2200</span>
              </div>
            </div>

            {/* Media Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Media</label>
              <div className="flex gap-2 flex-wrap">
                {mediaUrls.map((url) => (
                  <div
                    key={url}
                    className="relative h-20 w-20 rounded-lg overflow-hidden border group"
                  >
                    <img
                      src={url}
                      alt="Media"
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveMedia(url)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddMedia}
                  className="h-20 w-20 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-accent/50 transition-colors"
                >
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              </div>
            </div>

            {/* Platform Selection */}
            {accounts && accounts.length > 0 && (
              <PlatformSelector
                accounts={accounts}
                selected={selectedPlatforms}
                onToggle={handleTogglePlatform}
              />
            )}

            {/* Preview */}
            {accounts && accounts.length > 0 && (
              <PostPreview
                content={content}
                selectedIds={selectedPlatforms}
                accounts={accounts}
              />
            )}

            {/* Publish Results */}
            {publishResults && <PublishResults results={publishResults} />}

            {/* Actions */}
            <Separator />
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {selectedPlatforms.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPlatforms.length} platform
                    {selectedPlatforms.length > 1 ? "s" : ""} selected
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!content.trim() || isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSchedule}
                  disabled={
                    !content.trim() ||
                    selectedPlatforms.length === 0 ||
                    isSubmitting
                  }
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button
                  onClick={handlePublishNow}
                  disabled={
                    !content.trim() ||
                    selectedPlatforms.length === 0 ||
                    isSubmitting
                  }
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publish Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
