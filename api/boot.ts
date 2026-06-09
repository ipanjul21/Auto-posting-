import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { startSchedulerJob, stopSchedulerJob } from "./schedulerJob";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Scheduler status endpoint
app.get("/api/scheduler/status", (c) => {
  const { isSchedulerRunning } = require("./schedulerJob");
  return c.json({
    running: isSchedulerRunning(),
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.isProduction ? "production" : "development",
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start scheduler job in production
    startSchedulerJob(60000); // Check every 60 seconds
    console.log("[Scheduler] Auto-posting scheduler started");
  });
  
  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received, shutting down...");
    stopSchedulerJob();
    process.exit(0);
  });
  
  process.on("SIGINT", () => {
    console.log("[Server] SIGINT received, shutting down...");
    stopSchedulerJob();
    process.exit(0);
  });
} else {
  // Start scheduler in development too
  startSchedulerJob(60000);
  console.log("[Scheduler] Auto-posting scheduler started (dev mode)");
}
