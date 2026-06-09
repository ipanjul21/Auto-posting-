export const LOGIN_PATH = "/login";

export const PLATFORM_CONFIG = {
  facebook: {
    name: "Facebook",
    color: "#1877F2",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    icon: "Facebook",
  },
  instagram: {
    name: "Instagram",
    color: "#E4405F",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600",
    icon: "Instagram",
  },
  tiktok: {
    name: "TikTok",
    color: "#000000",
    bgColor: "bg-gray-50",
    textColor: "text-gray-800",
    icon: "Music",
  },
  threads: {
    name: "Threads",
    color: "#000000",
    bgColor: "bg-gray-50",
    textColor: "text-gray-800",
    icon: "AtSign",
  },
} as const;

export type PlatformType = keyof typeof PLATFORM_CONFIG;
