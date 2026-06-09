/**
 * TikTok API Service
 * Dokumentasi: https://developers.tiktok.com/doc/overview/
 *
 * Endpoint utama:
 * - POST /v2/post/publish/video/init/ - Init video upload
 * - POST /v2/post/publish/video/upload/ - Upload video
 * - POST /v2/post/publish/content/init/ - Publish content
 */

import { HttpClient } from "../lib/http";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

interface TikTokPublishResponse {
  data: {
    publish_id: string;
    share_url: string;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokVideoInfoResponse {
  data: {
    videos: Array<{
      id: string;
      title: string;
      video_description: string;
      duration: number;
      cover_image_url: string;
      share_url: string;
      create_time: number;
      like_count: number;
      comment_count: number;
      share_count: number;
      view_count: number;
    }>;
  };
  error: {
    code: string;
    message: string;
  };
}

export class TikTokService {
  private client: HttpClient;

  constructor(accessToken: string) {
    this.client = new HttpClient(TIKTOK_API_BASE, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Initialize direct video post (URL-based)
   */
  async publishVideoFromUrl(
    videoUrl: string,
    title: string,
    description: string,
    privacyLevel: "PUBLIC" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY" = "PUBLIC",
    disableDuet = false,
    disableStitch = false,
    disableComment = false
  ): Promise<{ publishId: string; shareUrl: string }> {
    const response = await this.client.post<TikTokPublishResponse>(
      "/post/publish/video/init/",
      {
        source_info: {
          source: "PULL_FROM_URL",
          url: videoUrl,
        },
        title,
        description,
        privacy_level: privacyLevel,
        disable_duet: disableDuet,
        disable_stitch: disableStitch,
        disable_comment: disableComment,
      }
    );

    if (response.error.code !== "ok") {
      throw new Error(`TikTok API Error: ${response.error.message}`);
    }

    return {
      publishId: response.data.publish_id,
      shareUrl: response.data.share_url,
    };
  }

  /**
   * Publish photo content
   */
  async publishPhotoContent(
    photoUrls: string[],
    title: string,
    description: string,
    privacyLevel: "PUBLIC" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY" = "PUBLIC"
  ): Promise<{ publishId: string; shareUrl: string }> {
    const response = await this.client.post<TikTokPublishResponse>(
      "/post/publish/content/init/",
      {
        post_info: {
          title,
          description,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
          cover_enabled: true,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: photoUrls,
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }
    );

    if (response.error.code !== "ok") {
      throw new Error(`TikTok API Error: ${response.error.message}`);
    }

    return {
      publishId: response.data.publish_id,
      shareUrl: response.data.share_url,
    };
  }

  /**
   * Get video info by IDs
   */
  async getVideoInfo(videoIds: string[]): Promise<TikTokVideoInfoResponse> {
    return this.client.post<TikTokVideoInfoResponse>(
      "/video/query/",
      {
        filters: {
          video_ids: videoIds,
        },
      }
    );
  }

  /**
   * List user's videos
   */
  async listVideos(cursor = 0, maxCount = 20): Promise<TikTokVideoInfoResponse> {
    return this.client.post<TikTokVideoInfoResponse>(
      "/video/list/",
      {
        cursor,
        max_count: maxCount,
      }
    );
  }

  /**
   * Validate token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.client.post("/user/info/", { fields: ["open_id", "union_id", "avatar_url", "display_name"] });
      return true;
    } catch {
      return false;
    }
  }
}

export async function publishToTikTok(
  accessToken: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ platformPostId: string; postUrl: string }> {
  const service = new TikTokService(accessToken);

  let result: { publishId: string; shareUrl: string };

  if (mediaUrls && mediaUrls.length > 0) {
    const firstMedia = mediaUrls[0];
    const isVideo = firstMedia.match(/\.(mp4|mov|avi|wmv)$/i);

    if (isVideo) {
      result = await service.publishVideoFromUrl(firstMedia, content, content);
    } else {
      result = await service.publishPhotoContent(mediaUrls, content, content);
    }
  } else {
    // TikTok requires media
    throw new Error("TikTok requires at least one video or photo");
  }

  return {
    platformPostId: result.publishId,
    postUrl: result.shareUrl,
  };
}
