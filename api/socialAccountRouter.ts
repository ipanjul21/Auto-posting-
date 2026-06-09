import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findSocialAccountsByUser,
  findSocialAccountById,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
} from "./queries/socialAccounts";

export const socialAccountRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findSocialAccountsByUser(ctx.user.id),
  ),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      findSocialAccountById(input.id),
    ),

  create: authedQuery
    .input(
      z.object({
        platform: z.enum(["facebook", "instagram", "tiktok", "threads"]),
        accountName: z.string().min(1),
        accountId: z.string().min(1),
        accessToken: z.string().min(1),
        refreshToken: z.string().optional(),
        tokenExpiresAt: z.date().optional(),
        profilePicture: z.string().optional(),
        followerCount: z.number().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createSocialAccount({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          accountName: z.string().optional(),
          accessToken: z.string().optional(),
          refreshToken: z.string().optional(),
          tokenExpiresAt: z.date().optional(),
          profilePicture: z.string().optional(),
          followerCount: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      }),
    )
    .mutation(({ input }) =>
      updateSocialAccount(input.id, input.data),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      deleteSocialAccount(input.id),
    ),
});
