/**
 * Threads API Service
 * Dokumentasi: https://developers.facebook.com/docs/threads
 *
 * Endpoint utama:
 * - POST /v1.0/{threads-user-id}/threads - Create text post
 * - POST /v1.0/{threads-user-id}/threads_publish - Publish post
 * - POST /v1.0/{threads-user-id}/threads_media - Create media post
 */

import { HttpClient } from "../lib/http";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

interface ThreadsCreateResponse {
  id: string;
}

interface ThreadsPublishResponse {
  id: string;
}

interface ThreadsMediaStatusResponse {
  status: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
  id: string;
}

export class ThreadsService {
  private client: HttpClient;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = new HttpClient(THREADS_API_BASE);
  }

  /**
   * Create a text post container
   */
  async createTextContainer(
    userId: string,
    text: string,
    replyToId?: string
  ): Promise<string> {
    const body: Record<string, string> = {
      text,
      access_token: this.accessToken,
    };
    if (replyToId) {
      body.reply_to_id = replyToId;
    }

    const response = await this.client.post<ThreadsCreateResponse>(
      `/${userId}/threads`,
      body
    );
    return response.id;
  }

  /**
   * Create an image post container
   */
  async createImageContainer(
    userId: string,
    text: string,
    imageUrl: string
  ): Promise<string> {
    const response = await this.client.post<ThreadsCreateResponse>(
      `/${userId}/threads`,
      {
        text,
        image_url: imageUrl,
        access_token: this.accessToken,
        media_type: "IMAGE",
      }
    );
    return response.id;
  }

  /**
   * Create a video post container
   */
  async createVideoContainer(
    userId: string,
    text: string,
    videoUrl: string
  ): Promise<string> {
    const response = await this.client.post<ThreadsCreateResponse>(
      `/${userId}/threads`,
      {
        text,
        video_url: videoUrl,
        access_token: this.accessToken,
        media_type: "VIDEO",
      }
    );
    return response.id;
  }

  /**
   * Create a carousel post container
   */
  async createCarouselContainer(
    userId: string,
    text: string,
    imageUrls: string[]
  ): Promise<string> {
    const response = await this.client.post<ThreadsCreateResponse>(
      `/${userId}/threads`,
      {
        text,
        media_type: "CAROUSEL",
        children: imageUrls.join(","),
        access_token: this.accessToken,
      }
    );
    return response.id;
  }

  /**
   * Publish a thread container
   */
  async publishContainer(userId: string, creationId: string): Promise<string> {
    const response = await this.client.post<ThreadsPublishResponse>(
      `/${userId}/threads_publish`,
      {
        creation_id: creationId,
        access_token: this.accessToken,
      }
    );
    return response.id;
  }

  /**
   * Check media status
   */
  async getMediaStatus(mediaId: string): Promise<string> {
    const response = await this.client.get<ThreadsMediaStatusResponse>(
      `/${mediaId}`,
      {
        fields: "status",
        access_token: this.accessToken,
      }
    );
    return response.status;
  }

  /**
   * Wait for media to be ready
   */
  async waitForMediaReady(mediaId: string, maxAttempts = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getMediaStatus(mediaId);
      if (status === "FINISHED" || status === "PUBLISHED") return true;
      if (status === "ERROR" || status === "EXPIRED") return false;
      await new Promise((r) => setTimeout(r, 3000));
    }
    return false;
  }

  /**
   * Get thread insights
   */
  async getThreadInsights(
    threadId: string
  ): Promise<{
    views: number;
    likes: number;
    replies: number;
    quotes: number;
    reposts: number;
  }> {
    try {
      const response = await this.client.get<{
        data: Array<{
          name: string;
          values: Array<{ value: number }>;
        }>;
      }>(
        `/${threadId}/insights`,
        {
          metric: "views,likes,replies,quotes,reposts",
          access_token: this.accessToken,
        }
      );

      const metrics = response.data;
      return {
        views: metrics.find((m) => m.name === "views")?.values[0]?.value ?? 0,
        likes: metrics.find((m) => m.name === "likes")?.values[0]?.value ?? 0,
        replies:
          metrics.find((m) => m.name === "replies")?.values[0]?.value ?? 0,
        quotes:
          metrics.find((m) => m.name === "quotes")?.values[0]?.value ?? 0,
        reposts:
          metrics.find((m) => m.name === "reposts")?.values[0]?.value ?? 0,
      };
    } catch {
      return { views: 0, likes: 0, replies: 0, quotes: 0, reposts: 0 };
    }
  }

  /**
   * Reply to a thread
   */
  async replyToThread(
    userId: string,
    parentThreadId: string,
    text: string
  ): Promise<string> {
    const containerId = await this.createTextContainer(
      userId,
      text,
      parentThreadId
    );
    return this.publishContainer(userId, containerId);
  }
}

export async function publishToThreads(
  accessToken: string,
  userId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ platformPostId: string; postUrl: string }> {
  const service = new ThreadsService(accessToken);

  let creationId: string;

  if (mediaUrls && mediaUrls.length > 0) {
    if (mediaUrls.length === 1) {
      const isVideo = mediaUrls[0].match(/\.(mp4|mov|avi|wmv)$/i);
      if (isVideo) {
        creationId = await service.createVideoContainer(
          userId,
          content,
          mediaUrls[0]
        );
      } else {
        creationId = await service.createImageContainer(
          userId,
          content,
          mediaUrls[0]
        );
      }
    } else {
      // Multiple images = carousel
      creationId = await service.createCarouselContainer(
        userId,
        content,
        mediaUrls
      );
    }
  } else {
    // Text-only post
    creationId = await service.createTextContainer(userId, content);
  }

  // Wait for media to be ready (if media post)
  if (mediaUrls && mediaUrls.length > 0) {
    const isReady = await service.waitForMediaReady(creationId);
    if (!isReady) {
      throw new Error("Media processing timed out or failed");
    }
  }

  // Publish
  const threadId = await service.publishContainer(userId, creationId);

  return {
    platformPostId: threadId,
    postUrl: `https://threads.net/@user/post/${threadId}`,
  };
}
