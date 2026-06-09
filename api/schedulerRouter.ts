import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findScheduledPostsByUser,
  findScheduledPostById,
  createScheduledPost,
  updateScheduledPost,
  deleteScheduledPost,
  findScheduledPostsByUserAndDateRange,
} from "./queries/scheduler";

export const schedulerRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findScheduledPostsByUser(ctx.user.id),
  ),

  listByDateRange: authedQuery
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(({ ctx, input }) =>
      findScheduledPostsByUserAndDateRange(ctx.user.id, input.startDate, input.endDate),
    ),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      findScheduledPostById(input.id),
    ),

  create: authedQuery
    .input(
      z.object({
        postId: z.number(),
        scheduledAt: z.date(),
        timezone: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringPattern: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createScheduledPost({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          scheduledAt: z.date().optional(),
          timezone: z.string().optional(),
          isRecurring: z.boolean().optional(),
          recurringPattern: z.string().optional(),
          status: z.enum(["pending", "processing", "completed", "cancelled", "failed"]).optional(),
        }),
      }),
    )
    .mutation(({ input }) =>
      updateScheduledPost(input.id, input.data),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      deleteScheduledPost(input.id),
    ),
});
