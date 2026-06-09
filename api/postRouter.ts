import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findPostsByUser,
  findPostById,
  createPost,
  updatePost,
  deletePost,
  createPostPlatform,
  findPostPlatformsByPostId,
} from "./queries/posts";

export const postRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findPostsByUser(ctx.user.id),
  ),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      findPostById(input.id),
    ),

  create: authedQuery
    .input(
      z.object({
        content: z.string().min(1, "Content is required"),
        mediaUrls: z.array(z.string()).optional(),
        platformAccountIds: z.array(z.number()).min(1, "Select at least one platform"),
        status: z.enum(["draft", "scheduled", "published"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { platformAccountIds, ...postData } = input;
      
      const newPost = await createPost({
        ...postData,
        userId: ctx.user.id,
        status: postData.status || "draft",
      });

      if (newPost && platformAccountIds.length > 0) {
        await Promise.all(
          platformAccountIds.map((accountId) =>
            createPostPlatform({
              postId: newPost.id,
              accountId,
              status: "pending",
            })
          )
        );
      }

      return newPost ? findPostById(newPost.id) : null;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          content: z.string().optional(),
          mediaUrls: z.array(z.string()).optional(),
          status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
        }),
      }),
    )
    .mutation(({ input }) =>
      updatePost(input.id, input.data),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      deletePost(input.id),
    ),

  platforms: authedQuery
    .input(z.object({ postId: z.number() }))
    .query(({ input }) =>
      findPostPlatformsByPostId(input.postId),
    ),
});
