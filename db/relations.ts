import { relations } from "drizzle-orm";
import {
  users,
  socialAccounts,
  posts,
  postPlatforms,
  scheduledPosts,
  postAnalytics,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  posts: many(posts),
  scheduledPosts: many(scheduledPosts),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  user: one(users, { fields: [socialAccounts.userId], references: [users.id] }),
  postPlatforms: many(postPlatforms),
  analytics: many(postAnalytics),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  platforms: many(postPlatforms),
  scheduledPost: one(scheduledPosts, { fields: [posts.id], references: [scheduledPosts.postId] }),
  analytics: many(postAnalytics),
}));

export const postPlatformsRelations = relations(postPlatforms, ({ one }) => ({
  post: one(posts, { fields: [postPlatforms.postId], references: [posts.id] }),
  account: one(socialAccounts, { fields: [postPlatforms.accountId], references: [socialAccounts.id] }),
}));

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  post: one(posts, { fields: [scheduledPosts.postId], references: [posts.id] }),
  user: one(users, { fields: [scheduledPosts.userId], references: [users.id] }),
}));

export const postAnalyticsRelations = relations(postAnalytics, ({ one }) => ({
  post: one(posts, { fields: [postAnalytics.postId], references: [posts.id] }),
  account: one(socialAccounts, { fields: [postAnalytics.accountId], references: [socialAccounts.id] }),
}));
