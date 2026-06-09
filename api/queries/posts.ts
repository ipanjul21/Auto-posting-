import { getDb } from "./connection";
import { posts, postPlatforms, scheduledPosts } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export async function findPostsByUser(userId: number) {
  return getDb().query.posts.findMany({
    where: eq(posts.userId, userId),
    orderBy: [desc(posts.createdAt)],
  });
}

export async function findPostById(id: number) {
  return getDb().query.posts.findFirst({
    where: eq(posts.id, id),
    with: {
      platforms: {
        with: {
          account: true,
        },
      },
      scheduledPost: true,
    },
  });
}

export async function createPost(data: {
  userId: number;
  content: string;
  mediaUrls?: string[];
  status?: "draft" | "scheduled" | "published" | "failed";
}) {
  const [result] = await getDb()
    .insert(posts)
    .values({
      ...data,
      status: data.status || "draft",
    })
    .$returningId();
  return findPostById(result.id);
}

export async function updatePost(
  id: number,
  data: Partial<{
    content: string;
    mediaUrls: string[];
    status: "draft" | "scheduled" | "published" | "failed";
    publishedAt: Date;
  }>
) {
  await getDb()
    .update(posts)
    .set(data)
    .where(eq(posts.id, id));
  return findPostById(id);
}

export async function deletePost(id: number) {
  // Delete related records first
  await getDb()
    .delete(postPlatforms)
    .where(eq(postPlatforms.postId, id));
  await getDb()
    .delete(scheduledPosts)
    .where(eq(scheduledPosts.postId, id));
  await getDb()
    .delete(posts)
    .where(eq(posts.id, id));
}

// Post Platforms
export async function findPostPlatformsByPostId(postId: number) {
  return getDb().query.postPlatforms.findMany({
    where: eq(postPlatforms.postId, postId),
    with: {
      account: true,
    },
  });
}

export async function createPostPlatform(data: {
  postId: number;
  accountId: number;
  status?: "pending" | "published" | "failed";
}) {
  const [result] = await getDb()
    .insert(postPlatforms)
    .values({
      ...data,
      status: data.status || "pending",
    })
    .$returningId();
  return result.id;
}

export async function updatePostPlatform(
  id: number,
  data: Partial<{
    platformPostId: string;
    postUrl: string;
    status: "pending" | "published" | "failed";
    errorMessage: string;
    publishedAt: Date;
  }>
) {
  await getDb()
    .update(postPlatforms)
    .set(data)
    .where(eq(postPlatforms.id, id));
}

export async function deletePostPlatform(id: number) {
  await getDb()
    .delete(postPlatforms)
    .where(eq(postPlatforms.id, id));
}
