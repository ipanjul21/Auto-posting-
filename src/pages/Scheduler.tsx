import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  RotateCcw,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarClock,
} from "lucide-react";

const statusConfig: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
> = {
  pending: {
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
    label: "Pending",
  },
  processing: {
    color: "bg-amber-100 text-amber-700",
    icon: Loader2,
    label: "Processing",
  },
  completed: {
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
    label: "Completed",
  },
  cancelled: {
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
    label: "Cancelled",
  },
  failed: {
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
    label: "Failed",
  },
};

const postStatusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-gray-100 text-gray-700", label: "Draft" },
  scheduled: { color: "bg-blue-100 text-blue-700", label: "Scheduled" },
  published: { color: "bg-green-100 text-green-700", label: "Published" },
  failed: { color: "bg-red-100 text-red-700", label: "Failed" },
};

function ScheduleCard({
  schedule,
  onCancel,
  onDelete,
}: {
  schedule: {
    id: number;
    scheduledAt: Date;
    timezone: string;
    isRecurring: boolean;
    recurringPattern: string | null;
    status: string;
    post: {
      id: number;
      content: string;
      status: string;
      mediaUrls: string[] | null;
    } | null;
  };
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const config = statusConfig[schedule.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const postConfig = postStatusConfig[schedule.post?.status || "draft"];

  return (
    <Card className="border-border/60 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${config.color}`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
              {schedule.isRecurring && (
                <Badge variant="outline" className="text-xs">
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {schedule.recurringPattern}
                </Badge>
              )}
              {postConfig && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${postConfig.color}`}
                >
                  {postConfig.label}
                </Badge>
              )}
            </div>

            <p className="text-sm font-medium line-clamp-2">
              {schedule.post?.content || "No content"}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  {new Date(schedule.scheduledAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(schedule.scheduledAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <span>{schedule.timezone}</span>
            </div>

            {schedule.post?.mediaUrls && schedule.post.mediaUrls.length > 0 && (
              <div className="flex gap-2 pt-1">
                {schedule.post.mediaUrls.slice(0, 3).map((url, i) => (
                  <div
                    key={i}
                    className="h-12 w-12 rounded-md overflow-hidden border"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
                {schedule.post.mediaUrls.length > 3 && (
                  <div className="h-12 w-12 rounded-md border flex items-center justify-center text-xs text-muted-foreground">
                    +{schedule.post.mediaUrls.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {schedule.status === "pending" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600"
                onClick={() => onCancel(schedule.id)}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {schedule.status === "cancelled" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={() => onCancel(schedule.id)}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(schedule.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Scheduler() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<string>("all");

  const { data: schedules, isLoading } = trpc.scheduler.list.useQuery();

  const updateSchedule = trpc.scheduler.update.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      toast.success("Schedule updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update schedule");
    },
  });

  const deleteSchedule = trpc.scheduler.delete.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      toast.success("Schedule deleted!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete schedule");
    },
  });

  const handleCancel = (id: number) => {
    const schedule = schedules?.find((s) => s.id === id);
    if (!schedule) return;

    const newStatus = schedule.status === "pending" ? "cancelled" : "pending";
    updateSchedule.mutate({
      id,
      data: { status: newStatus as "pending" | "cancelled" },
    });
  };

  const handleDelete = (id: number) => {
    deleteSchedule.mutate({ id });
  };

  const filteredSchedules =
    schedules?.filter((s) => {
      if (filter === "all") return true;
      return s.status === filter;
    }) || [];

  const statusCounts = {
    all: schedules?.length || 0,
    pending: schedules?.filter((s) => s.status === "pending").length || 0,
    processing:
      schedules?.filter((s) => s.status === "processing").length || 0,
    completed:
      schedules?.filter((s) => s.status === "completed").length || 0,
    cancelled:
      schedules?.filter((s) => s.status === "cancelled").length || 0,
    failed: schedules?.filter((s) => s.status === "failed").length || 0,
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scheduler</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your scheduled posts and automation.
            </p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              "all",
              "pending",
              "processing",
              "completed",
              "cancelled",
              "failed",
            ] as const
          ).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="text-xs capitalize"
            >
              {status}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {statusCounts[status]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-lg font-bold">
                    {statusCounts.pending + statusCounts.processing}
                  </p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-lg font-bold">{statusCounts.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-lg font-bold">
                    {schedules?.filter((s) => s.isRecurring).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Recurring</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-lg font-bold">{statusCounts.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredSchedules.length > 0 ? (
          <div className="space-y-3">
            {filteredSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                {filter === "all"
                  ? "No scheduled posts yet"
                  : `No ${filter} schedules`}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {filter === "all"
                  ? "Create a post and schedule it to see it here."
                  : `Schedules with "${filter}" status will appear here.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}
