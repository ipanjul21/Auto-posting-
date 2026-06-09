/**
 * Facebook Graph API Service
 * Dokumentasi: https://developers.facebook.com/docs/graph-api
 *
 * Endpoint utama:
 * - POST /{page-id}/feed - Publish text post
 * - POST /{page-id}/photos - Publish photo
 * - POST /{page-id}/videos - Publish video
 */

import { HttpClient } from "../lib/http";

const FB_API_BASE = "https://graph.facebook.com/v19.0";

interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

export class FacebookService {
  private client: HttpClient;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = new HttpClient(FB_API_BASE);
  }

  /**
   * Publish text post to Facebook Page
   */
  async publishText(pageId: string, message: string): Promise<FacebookPostResponse> {
    return this.client.post<FacebookPostResponse>(
      `/${pageId}/feed`,
      {
        message,
        access_token: this.accessToken,
      }
    );
  }

  /**
   * Publish photo with caption to Facebook Page
   */
  async publishPhoto(
    pageId: string,
    message: string,
    photoUrl: string
  ): Promise<FacebookPostResponse> {
    return this.client.post<FacebookPostResponse>(
      `/${pageId}/photos`,
      {
        message,
        url: photoUrl,
        access_token: this.accessToken,
        published: true,
      }
    );
  }

  /**
   * Publish video to Facebook Page
   */
  async publishVideo(
    pageId: string,
    description: string,
    videoUrl: string
  ): Promise<FacebookPostResponse> {
    return this.client.post<FacebookPostResponse>(
      `/${pageId}/videos`,
      {
        description,
        file_url: videoUrl,
        access_token: this.accessToken,
        published: true,
      }
    );
  }

  /**
   * Get page access token from user token
   */
  async getPageAccessToken(pageId: string): Promise<string> {
    const response = await this.client.get<{
      data: Array<{ id: string; access_token: string }>;
    }>("/me/accounts", { access_token: this.accessToken });
    const page = response.data.find((p) => p.id === pageId);
    if (!page) {
      throw new Error("Page not found or no permission");
    }
    return page.access_token;
  }

  /**
   * Validate token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.client.get("/me", { access_token: this.accessToken });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get post insights
   */
  async getPostInsights(postId: string): Promise<{
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
  }> {
    try {
      const response = await this.client.get<{
        data: Array<{ name: string; values: Array<{ value: number }> }>;
      }>(
        `/${postId}/insights`,
        {
          metric: "post_impressions,post_reach,post_engaged_users,post_clicks",
          access_token: this.accessToken,
        }
      );

      const metrics = response.data;
      return {
        impressions: metrics.find((m) => m.name === "post_impressions")?.values[0]?.value ?? 0,
        reach: metrics.find((m) => m.name === "post_reach")?.values[0]?.value ?? 0,
        engagement: metrics.find((m) => m.name === "post_engaged_users")?.values[0]?.value ?? 0,
        clicks: metrics.find((m) => m.name === "post_clicks")?.values[0]?.value ?? 0,
      };
    } catch {
      return { impressions: 0, reach: 0, engagement: 0, clicks: 0 };
    }
  }
}

export async function publishToFacebook(
  accessToken: string,
  pageId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ platformPostId: string; postUrl: string }> {
  const service = new FacebookService(accessToken);

  let response: FacebookPostResponse;

  if (mediaUrls && mediaUrls.length > 0) {
    const firstMedia = mediaUrls[0];
    const isVideo = firstMedia.match(/\.(mp4|mov|avi|wmv)$/i);

    if (isVideo) {
      response = await service.publishVideo(pageId, content, firstMedia);
    } else {
      response = await service.publishPhoto(pageId, content, firstMedia);
    }
  } else {
    response = await service.publishText(pageId, content);
  }

  return {
    platformPostId: response.id,
    postUrl: `https://facebook.com/${response.id}`,
  };
}
