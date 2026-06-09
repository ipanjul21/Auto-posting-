import { getDb } from "./connection";
import { scheduledPosts } from "@db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function findScheduledPostsByUser(userId: number) {
  return getDb().query.scheduledPosts.findMany({
    where: eq(scheduledPosts.userId, userId),
    with: {
      post: true,
    },
    orderBy: [desc(scheduledPosts.scheduledAt)],
  });
}

export async function findScheduledPostsByUserAndDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  return getDb().query.scheduledPosts.findMany({
    where: and(
      eq(scheduledPosts.userId, userId),
      gte(scheduledPosts.scheduledAt, startDate),
      lte(scheduledPosts.scheduledAt, endDate)
    ),
    with: {
      post: true,
    },
    orderBy: [desc(scheduledPosts.scheduledAt)],
  });
}

export async function findScheduledPostById(id: number) {
  return getDb().query.scheduledPosts.findFirst({
    where: eq(scheduledPosts.id, id),
    with: {
      post: {
        with: {
          platforms: {
            with: {
              account: true,
            },
          },
        },
      },
    },
  });
}

export async function createScheduledPost(data: {
  postId: number;
  userId: number;
  scheduledAt: Date;
  timezone?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}) {
  const [result] = await getDb()
    .insert(scheduledPosts)
    .values({
      ...data,
      timezone: data.timezone || "UTC",
      isRecurring: data.isRecurring || false,
    })
    .$returningId();
  return findScheduledPostById(result.id);
}

export async function updateScheduledPost(
  id: number,
  data: Partial<{
    scheduledAt: Date;
    timezone: string;
    isRecurring: boolean;
    recurringPattern: string;
    status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  }>
) {
  await getDb()
    .update(scheduledPosts)
    .set(data)
    .where(eq(scheduledPosts.id, id));
  return findScheduledPostById(id);
}

export async function deleteScheduledPost(id: number) {
  await getDb()
    .delete(scheduledPosts)
    .where(eq(scheduledPosts.id, id));
}

export async function findPendingScheduledPostsBeforeDate(date: Date) {
  return getDb().query.scheduledPosts.findMany({
    where: and(
      eq(scheduledPosts.status, "pending"),
      lte(scheduledPosts.scheduledAt, date)
    ),
    with: {
      post: {
        with: {
          platforms: {
            with: {
              account: true,
            },
          },
        },
      },
    },
  });
}
