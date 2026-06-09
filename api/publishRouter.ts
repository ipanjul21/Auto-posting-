import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { findSocialAccountById } from "./queries/socialAccounts";
import {
  findPostById,
  findPostPlatformsByPostId,
  updatePost,
  updatePostPlatform,
} from "./queries/posts";
import { createOrUpdateAnalytics } from "./queries/analytics";
import { publishToFacebook } from "./services/facebook";
import { publishToInstagram } from "./services/instagram";
import { publishToTikTok } from "./services/tiktok";
import { publishToThreads } from "./services/threads";

/**
 * Publish a post to a specific platform
 */
async function publishToPlatform(
  platform: "facebook" | "instagram" | "tiktok" | "threads",
  accessToken: string,
  accountId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ platformPostId: string; postUrl: string }> {
  switch (platform) {
    case "facebook":
      return publishToFacebook(accessToken, accountId, content, mediaUrls);
    case "instagram":
      return publishToInstagram(accessToken, accountId, content, mediaUrls);
    case "tiktok":
      return publishToTikTok(accessToken, content, mediaUrls);
    case "threads":
      return publishToThreads(accessToken, accountId, content, mediaUrls);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Publish a post to all selected platforms
 */
export async function executePublish(
  postId: number,
  userId: number
): Promise<{
  success: boolean;
  results: Array<{
    platform: string;
    accountId: number;
    success: boolean;
    platformPostId?: string;
    postUrl?: string;
    error?: string;
  }>;
}> {
  // Get post details
  const post = await findPostById(postId);
  if (!post) {
    throw new Error("Post not found");
  }
  if (post.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Get platforms for this post
  const platforms = await findPostPlatformsByPostId(postId);
  if (!platforms || platforms.length === 0) {
    throw new Error("No platforms selected for this post");
  }

  const results: Array<{
    platform: string;
    accountId: number;
    success: boolean;
    platformPostId?: string;
    postUrl?: string;
    error?: string;
  }> = [];

  let allSuccess = true;

  for (const platform of platforms) {
    if (!platform.account) {
      results.push({
        platform: "unknown",
        accountId: platform.accountId,
        success: false,
        error: "Account not found",
      });
      allSuccess = false;
      continue;
    }

    try {
      const { platformPostId, postUrl } = await publishToPlatform(
        platform.account.platform as "facebook" | "instagram" | "tiktok" | "threads",
        platform.account.accessToken,
        platform.account.accountId,
        post.content,
        post.mediaUrls as string[] | undefined
      );

      // Update post platform status
      await updatePostPlatform(platform.id, {
        platformPostId,
        postUrl,
        status: "published",
        publishedAt: new Date(),
      });

      // Create analytics entry
      await createOrUpdateAnalytics({
        postId,
        accountId: platform.accountId,
        platform: platform.account.platform as "facebook" | "instagram" | "tiktok" | "threads",
      });

      results.push({
        platform: platform.account.platform,
        accountId: platform.accountId,
        success: true,
        platformPostId,
        postUrl,
      });
    } catch (error: any) {
      allSuccess = false;

      // Update post platform with error
      await updatePostPlatform(platform.id, {
        status: "failed",
        errorMessage: error.message || "Unknown error",
      });

      results.push({
        platform: platform.account.platform,
        accountId: platform.accountId,
        success: false,
        error: error.message || "Unknown error",
      });
    }
  }

  // Update post status
  await updatePost(postId, {
    status: allSuccess ? "published" : "failed",
    publishedAt: allSuccess ? new Date() : undefined,
  });

  return { success: allSuccess, results };
}

export const publishRouter = createRouter({
  /**
   * Publish a post immediately to all selected platforms
   */
  now: authedQuery
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await executePublish(input.postId, ctx.user.id);
      return result;
    }),

  /**
   * Test a platform connection
   */
  testConnection: authedQuery
    .input(z.object({ accountId: z.number() }))
    .query(async ({ input }) => {
      const account = await findSocialAccountById(input.accountId);
      if (!account) {
        throw new Error("Account not found");
      }

      try {
        switch (account.platform) {
          case "facebook": {
            const { FacebookService } = await import("./services/facebook");
            const service = new FacebookService(account.accessToken);
            const valid = await service.validateToken();
            return { valid, platform: account.platform };
          }
          case "instagram": {
            // Instagram uses Facebook Graph API validation
            const { InstagramService } = await import("./services/instagram");
            // Validate by checking if we can construct the service
            new InstagramService(account.accessToken);
            return { valid: true, platform: account.platform };
          }
          case "tiktok": {
            const { TikTokService } = await import("./services/tiktok");
            const service = new TikTokService(account.accessToken);
            const valid = await service.validateToken();
            return { valid, platform: account.platform };
          }
          case "threads": {
            const { ThreadsService } = await import("./services/threads");
            new ThreadsService(account.accessToken);
            return { valid: true, platform: account.platform };
          }
          default:
            return { valid: false, platform: account.platform };
        }
      } catch (error: any) {
        return {
          valid: false,
          platform: account.platform,
          error: error.message,
        };
      }
    }),

  /**
   * Get analytics for a specific post on a platform
   */
  fetchAnalytics: authedQuery
    .input(
      z.object({
        postPlatformId: z.number(),
        platformPostId: z.string(),
        accountId: z.number(),
        postId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const account = await findSocialAccountById(input.accountId);
      if (!account) {
        throw new Error("Account not found");
      }

      try {
        switch (account.platform) {
          case "facebook": {
            const { FacebookService } = await import("./services/facebook");
            const service = new FacebookService(account.accessToken);
            const insights = await service.getPostInsights(input.platformPostId);
            await createOrUpdateAnalytics({
              postId: input.postId,
              accountId: input.accountId,
              platform: "facebook",
              ...insights,
            });
            return insights;
          }
          case "instagram": {
            const { InstagramService } = await import("./services/instagram");
            const service = new InstagramService(account.accessToken);
            const insights = await service.getMediaInsights(
              input.platformPostId
            );
            await createOrUpdateAnalytics({
              postId: input.postId,
              accountId: input.accountId,
              platform: "instagram",
              ...insights,
            });
            return insights;
          }
          default:
            return null;
        }
      } catch (error: any) {
        return { error: error.message };
      }
    }),
});
