import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Facebook,
  Instagram,
  Music,
  AtSign,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Users,
  Key,
  AlertCircle,
} from "lucide-react";
import { PLATFORM_CONFIG, type PlatformType } from "@/const";

const platformIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  threads: AtSign,
};

const platformSteps: Record<string, string[]> = {
  facebook: [
    "Go to Facebook Developers portal",
    "Create a new app or select existing app",
    "Add Facebook Login product",
    "Copy App ID and App Secret",
    "Generate User Access Token with publish permissions",
  ],
  instagram: [
    "Go to Facebook Developers portal (Instagram uses Facebook API)",
    "Create a Business/Creator Instagram account",
    "Connect Instagram account to Facebook Page",
    "Get Instagram Basic Display API token",
    "Use Facebook Graph API for publishing",
  ],
  tiktok: [
    "Go to TikTok for Developers portal",
    "Register your application",
    "Get Client Key and Client Secret",
    "Configure OAuth redirect URI",
    "Request content posting permissions",
  ],
  threads: [
    "Go to Meta for Developers portal",
    "Create a new app",
    "Add Threads API product",
    "Configure OAuth settings",
    "Get Access Token with threads_content_publish scope",
  ],
};

function AccountCard({
  account,
  onToggle,
  onDelete,
}: {
  account: {
    id: number;
    platform: PlatformType;
    accountName: string;
    accountId: string;
    profilePicture: string | null;
    followerCount: number | null;
    isActive: boolean;
    createdAt: Date;
  };
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const config = PLATFORM_CONFIG[account.platform];
  const Icon = platformIcons[account.platform] || Music;

  return (
    <Card className="border-border/60 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: config.color + "15" }}
            >
              <Icon className="h-6 w-6" style={{ color: config.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{account.accountName}</p>
                <Badge
                  variant={account.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {account.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.name} · ID: {account.accountId.slice(0, 12)}...
              </p>
              {account.followerCount ? (
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {account.followerCount.toLocaleString()} followers
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                account.isActive
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
              onClick={() => onToggle(account.id, !account.isActive)}
            >
              {account.isActive ? (
                <Power className="h-4 w-4" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(account.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddAccountDialog({
  platform,
  onAdd,
}: {
  platform: PlatformType;
  onAdd: (data: {
    platform: PlatformType;
    accountName: string;
    accountId: string;
    accessToken: string;
    refreshToken?: string;
    followerCount?: number;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [followerCount, setFollowerCount] = useState("");

  const config = PLATFORM_CONFIG[platform];
  const Icon = platformIcons[platform] || Music;
  const steps = platformSteps[platform] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountId || !accessToken) {
      toast.error("Please fill in all required fields");
      return;
    }
    onAdd({
      platform,
      accountName,
      accountId,
      accessToken,
      refreshToken: refreshToken || undefined,
      followerCount: followerCount ? parseInt(followerCount) : undefined,
    });
    setOpen(false);
    setAccountName("");
    setAccountId("");
    setAccessToken("");
    setRefreshToken("");
    setFollowerCount("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2 border-dashed border-2 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm">Add {config.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: config.color + "15" }}
            >
              <Icon className="h-5 w-5" style={{ color: config.color }} />
            </div>
            <div>
              <DialogTitle>Connect {config.name}</DialogTitle>
              <DialogDescription>
                Add your {config.name} account to start posting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Steps */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">How to get your credentials:</p>
            <ol className="space-y-1.5">
              {steps.map((step, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="shrink-0 font-medium text-foreground">
                    {i + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <Separator />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${platform}`}>
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`name-${platform}`}
                placeholder="e.g., My Business Page"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`id-${platform}`}>
                Account/Page ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`id-${platform}`}
                placeholder="e.g., 123456789"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`token-${platform}`}>
                Access Token <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`token-${platform}`}
                type="password"
                placeholder="Paste your access token here"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`refresh-${platform}`}>Refresh Token (Optional)</Label>
              <Input
                id={`refresh-${platform}`}
                type="password"
                placeholder="Paste your refresh token here"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`followers-${platform}`}>
                Follower Count (Optional)
              </Label>
              <Input
                id={`followers-${platform}`}
                type="number"
                placeholder="e.g., 10000"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Connect Account
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Accounts() {
  const utils = trpc.useUtils();

  const { data: accounts, isLoading } = trpc.socialAccount.list.useQuery();

  const createAccount = trpc.socialAccount.create.useMutation({
    onSuccess: () => {
      utils.socialAccount.list.invalidate();
      toast.success("Account connected successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to connect account");
    },
  });

  const updateAccount = trpc.socialAccount.update.useMutation({
    onSuccess: () => {
      utils.socialAccount.list.invalidate();
      toast.success("Account updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update account");
    },
  });

  const deleteAccount = trpc.socialAccount.delete.useMutation({
    onSuccess: () => {
      utils.socialAccount.list.invalidate();
      toast.success("Account disconnected!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect account");
    },
  });

  const handleAdd = (data: {
    platform: PlatformType;
    accountName: string;
    accountId: string;
    accessToken: string;
    refreshToken?: string;
    followerCount?: number;
  }) => {
    createAccount.mutate(data);
  };

  const handleToggle = (id: number, isActive: boolean) => {
    updateAccount.mutate({
      id,
      data: { isActive },
    });
  };

  const handleDelete = (id: number) => {
    deleteAccount.mutate({ id });
  };

  const platforms: PlatformType[] = ["facebook", "instagram", "tiktok", "threads"];

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Connected Accounts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your social media platform connections.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                API Integration Guide
              </p>
              <p className="text-xs text-blue-700 mt-1">
                To post to social media platforms, you need to provide API
                credentials for each platform. Click "Add" on any platform card
                below to see step-by-step instructions for obtaining your API
                keys.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Sections */}
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const platformAccounts =
            accounts?.filter((a) => a.platform === platform) || [];
          const Icon = platformIcons[platform] || Music;

          return (
            <div key={platform} className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: config.color + "15" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                </div>
                <h2 className="text-lg font-semibold">{config.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {platformAccounts.length} account
                  {platformAccounts.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))
                  : platformAccounts.map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                <AddAccountDialog platform={platform} onAdd={handleAdd} />
              </div>
            </div>
          );
        })}
      </div>
    </AuthLayout>
  );
}
