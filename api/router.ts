import { authRouter } from "./auth-router";
import { socialAccountRouter } from "./socialAccountRouter";
import { postRouter } from "./postRouter";
import { schedulerRouter } from "./schedulerRouter";
import { analyticsRouter } from "./analyticsRouter";
import { publishRouter } from "./publishRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  socialAccount: socialAccountRouter,
  post: postRouter,
  scheduler: schedulerRouter,
  analytics: analyticsRouter,
  publish: publishRouter,
});

export type AppRouter = typeof appRouter;
