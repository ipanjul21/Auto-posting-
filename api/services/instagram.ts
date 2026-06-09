/**
 * Instagram Graph API Service
 * Dokumentasi: https://developers.facebook.com/docs/instagram-api
 *
 * Endpoint utama:
 * - POST /{ig-user-id}/media - Create media container
 * * POST /{ig-user-id}/media_publish - Publish media
 */

import { HttpClient } from "../lib/http";

const FB_API_BASE = "https://graph.facebook.com/v19.0";

interface InstagramMediaResponse {
  id: string;
}

interface InstagramPublishResponse {
  id: string;
}

export class InstagramService {
  private client: HttpClient;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = new HttpClient(FB_API_BASE);
  }

  /**
   * Create single image media container
   */
  async createImageContainer(
    igUserId: string,
    imageUrl: string,
    caption: string
  ): Promise<string> {
    const response = await this.client.post<InstagramMediaResponse>(
      `/${igUserId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: this.accessToken,
      }
    );
    return response.id;
  }

  /**
   * Create video media container
   */
  async createVideoContainer(
    igUserId: string,
    videoUrl: string,
    caption: string
  ): Promise<string> {
    const response = await this.client.post<InstagramMediaResponse>(
      `/${igUserId}/media`,
      {
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: this.accessToken,
        share_to_feed: true,
      }
    );
    return response.id;
  }

  /**
   * Create carousel media container (multiple images)
   */
  async createCarouselContainer(
    igUserId: string,
    imageUrls: string[],
    caption: string
  ): Promise<string> {
    // Create children containers
    const childrenIds: string[] = [];
    for (const url of imageUrls) {
      const response = await this.client.post<InstagramMediaResponse>(
        `/${igUserId}/media`,
        {
          is_carousel_item: true,
          image_url: url,
          access_token: this.accessToken,
        }
      );
      childrenIds.push(response.id);
    }

    // Create carousel container
    const response = await this.client.post<InstagramMediaResponse>(
      `/${igUserId}/media`,
      {
        media_type: "CAROUSEL",
        children: childrenIds.join(","),
        caption,
        access_token: this.accessToken,
      }
    );
    return response.id;
  }

  /**
   * Publish media container
   */
  async publishMedia(igUserId: string, creationId: string): Promise<string> {
    const response = await this.client.post<InstagramPublishResponse>(
      `/${igUserId}/media_publish`,
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
  async getMediaStatus(mediaId: string): Promise<{
    status_code: string;
    status: string;
  }> {
    return this.client.get(`/${mediaId}`, {
      fields: "status_code",
      access_token: this.accessToken,
    });
  }

  /**
   * Get media insights
   */
  async getMediaInsights(mediaId: string): Promise<{
    impressions: number;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    try {
      const response = await this.client.get<{
        data: Array<{ name: string; values: Array<{ value: number }> }>;
      }>(
        `/${mediaId}/insights`,
        {
          metric: "impressions,reach,engagement",
          access_token: this.accessToken,
        }
      );

      const metrics = response.data;
      return {
        impressions: metrics.find((m) => m.name === "impressions")?.values[0]?.value ?? 0,
        reach: metrics.find((m) => m.name === "reach")?.values[0]?.value ?? 0,
        engagement: metrics.find((m) => m.name === "engagement")?.values[0]?.value ?? 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    } catch {
      return { impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };
    }
  }

  /**
   * Wait for media to be ready
   */
  async waitForMediaReady(mediaId: string, maxAttempts = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getMediaStatus(mediaId);
      if (status.status_code === "FINISHED") return true;
      if (status.status_code === "ERROR") return false;
      await new Promise((r) => setTimeout(r, 3000)); // Wait 3 seconds
    }
    return false;
  }
}

export async function publishToInstagram(
  accessToken: string,
  igUserId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ platformPostId: string; postUrl: string }> {
  const service = new InstagramService(accessToken);

  let creationId: string;

  if (mediaUrls && mediaUrls.length > 0) {
    if (mediaUrls.length === 1) {
      const isVideo = mediaUrls[0].match(/\.(mp4|mov|avi|wmv)$/i);
      if (isVideo) {
        creationId = await service.createVideoContainer(igUserId, mediaUrls[0], content);
      } else {
        creationId = await service.createImageContainer(igUserId, mediaUrls[0], content);
      }
    } else {
      // Multiple images = carousel
      creationId = await service.createCarouselContainer(igUserId, mediaUrls, content);
    }
  } else {
    // Instagram requires media, use placeholder or throw error
    throw new Error("Instagram requires at least one image or video");
  }

  // Wait for media to be ready
  const isReady = await service.waitForMediaReady(creationId);
  if (!isReady) {
    throw new Error("Media processing timed out or failed");
  }

  // Publish
  const mediaId = await service.publishMedia(igUserId, creationId);

  return {
    platformPostId: mediaId,
    postUrl: `https://instagram.com/p/${mediaId}`,
  };
}
