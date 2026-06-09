import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAnalyticsByPostId,
  getAggregatedStatsByUser,
  createOrUpdateAnalytics,
} from "./queries/analytics";
import { findSocialAccountsByUser } from "./queries/socialAccounts";

export const analyticsRouter = createRouter({
  byPost: authedQuery
    .input(z.object({ postId: z.number() }))
    .query(({ input }) =>
      findAnalyticsByPostId(input.postId),
    ),

  aggregatedStats: authedQuery.query(async ({ ctx }) => {
    const accounts = await findSocialAccountsByUser(ctx.user.id);
    const accountIds = accounts.map((a) => a.id);
    return getAggregatedStatsByUser(accountIds);
  }),

  createOrUpdate: authedQuery
    .input(
      z.object({
        postId: z.number(),
        accountId: z.number(),
        platform: z.enum(["facebook", "instagram", "tiktok", "threads"]),
        impressions: z.number().optional(),
        reach: z.number().optional(),
        engagement: z.number().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        shares: z.number().optional(),
        clicks: z.number().optional(),
        videoViews: z.number().optional(),
      }),
    )
    .mutation(({ input }) =>
      createOrUpdateAnalytics(input),
    ),
});
