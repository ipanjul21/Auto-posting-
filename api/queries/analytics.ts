import { getDb } from "./connection";
import { postAnalytics } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function findAnalyticsByPostId(postId: number) {
  return getDb().query.postAnalytics.findMany({
    where: eq(postAnalytics.postId, postId),
    with: {
      account: true,
    },
  });
}

export async function findAnalyticsByUserAccounts(accountIds: number[]) {
  if (accountIds.length === 0) return [];
  
  return getDb().query.postAnalytics.findMany({
    where: sql`${postAnalytics.accountId} IN (${accountIds.join(",")})`,
    orderBy: (analytics, { desc }) => [desc(analytics.createdAt)],
    limit: 100,
  });
}

export async function createOrUpdateAnalytics(data: {
  postId: number;
  accountId: number;
  platform: "facebook" | "instagram" | "tiktok" | "threads";
  impressions?: number;
  reach?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  videoViews?: number;
}) {
  const existing = await getDb().query.postAnalytics.findFirst({
    where: and(
      eq(postAnalytics.postId, data.postId),
      eq(postAnalytics.accountId, data.accountId)
    ),
  });

  if (existing) {
    await getDb()
      .update(postAnalytics)
      .set({
        ...data,
        lastUpdated: new Date(),
      })
      .where(eq(postAnalytics.id, existing.id));
    return existing.id;
  } else {
    const [result] = await getDb()
      .insert(postAnalytics)
      .values(data)
      .$returningId();
    return result.id;
  }
}

export async function getAggregatedStatsByUser(accountIds: number[]) {
  if (accountIds.length === 0) {
    return {
      totalImpressions: 0,
      totalReach: 0,
      totalEngagement: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalClicks: 0,
      totalVideoViews: 0,
    };
  }

  const result = await getDb()
    .select({
      totalImpressions: sql<number>`COALESCE(SUM(${postAnalytics.impressions}), 0)`,
      totalReach: sql<number>`COALESCE(SUM(${postAnalytics.reach}), 0)`,
      totalEngagement: sql<number>`COALESCE(SUM(${postAnalytics.engagement}), 0)`,
      totalLikes: sql<number>`COALESCE(SUM(${postAnalytics.likes}), 0)`,
      totalComments: sql<number>`COALESCE(SUM(${postAnalytics.comments}), 0)`,
      totalShares: sql<number>`COALESCE(SUM(${postAnalytics.shares}), 0)`,
      totalClicks: sql<number>`COALESCE(SUM(${postAnalytics.clicks}), 0)`,
      totalVideoViews: sql<number>`COALESCE(SUM(${postAnalytics.videoViews}), 0)`,
    })
    .from(postAnalytics)
    .where(sql`${postAnalytics.accountId} IN (${accountIds.join(",")})`);

  return result[0];
}
