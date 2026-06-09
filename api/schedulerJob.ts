/**
 * Scheduler Job - Auto-posting background service
 * 
 * This module handles automatic publishing of scheduled posts.
 * It checks for pending scheduled posts that are due and publishes them.
 * 
 * Usage:
 * - Call startSchedulerJob() to start the background job
 * - Call stopSchedulerJob() to stop it
 * - The job runs every 60 seconds by default
 */

import { findPendingScheduledPostsBeforeDate, updateScheduledPost } from "./queries/scheduler";
import { executePublish } from "./publishRouter";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/**
 * Process pending scheduled posts
 */
async function processScheduledPosts(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const pendingPosts = await findPendingScheduledPostsBeforeDate(now);

    if (!pendingPosts || pendingPosts.length === 0) {
      return;
    }

    console.log(`[Scheduler] Processing ${pendingPosts.length} scheduled posts...`);

    for (const scheduled of pendingPosts) {
      try {
        // Mark as processing
        await updateScheduledPost(scheduled.id, { status: "processing" });

        if (!scheduled.post) {
          await updateScheduledPost(scheduled.id, {
            status: "failed",
          });
          continue;
        }

        // Publish the post
        const result = await executePublish(
          scheduled.postId,
          scheduled.userId
        );

        if (result.success) {
          await updateScheduledPost(scheduled.id, { status: "completed" });
          console.log(`[Scheduler] Published post ${scheduled.postId} successfully`);
        } else {
          await updateScheduledPost(scheduled.id, { status: "failed" });
          console.log(`[Scheduler] Failed to publish post ${scheduled.postId}`);
        }
      } catch (error: any) {
        console.error(`[Scheduler] Error processing post ${scheduled.postId}:`, error.message);
        await updateScheduledPost(scheduled.id, { status: "failed" });
      }
    }
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduler background job
 */
export function startSchedulerJob(intervalMs = 60000): void {
  if (schedulerInterval) {
    console.log("[Scheduler] Already running");
    return;
  }

  console.log(`[Scheduler] Starting with ${intervalMs}ms interval`);
  
  // Run immediately on start
  processScheduledPosts();
  
  // Then run on interval
  schedulerInterval = setInterval(() => {
    processScheduledPosts().catch((err) => {
      console.error("[Scheduler] Error in scheduler job:", err);
    });
  }, intervalMs);
}

/**
 * Stop the scheduler background job
 */
export function stopSchedulerJob(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
