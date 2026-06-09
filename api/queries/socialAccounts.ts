import { getDb } from "./connection";
import { socialAccounts } from "@db/schema";
import { eq, and } from "drizzle-orm";

export async function findSocialAccountsByUser(userId: number) {
  return getDb().query.socialAccounts.findMany({
    where: eq(socialAccounts.userId, userId),
    orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
  });
}

export async function findSocialAccountById(id: number) {
  return getDb().query.socialAccounts.findFirst({
    where: eq(socialAccounts.id, id),
  });
}

export async function createSocialAccount(data: {
  userId: number;
  platform: "facebook" | "instagram" | "tiktok" | "threads";
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  profilePicture?: string;
  followerCount?: number;
}) {
  const [result] = await getDb()
    .insert(socialAccounts)
    .values(data)
    .$returningId();
  return findSocialAccountById(result.id);
}

export async function updateSocialAccount(
  id: number,
  data: Partial<{
    accountName: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
    profilePicture: string;
    followerCount: number;
    isActive: boolean;
  }>
) {
  await getDb()
    .update(socialAccounts)
    .set(data)
    .where(eq(socialAccounts.id, id));
  return findSocialAccountById(id);
}

export async function deleteSocialAccount(id: number) {
  await getDb()
    .delete(socialAccounts)
    .where(eq(socialAccounts.id, id));
}

export async function findSocialAccountByPlatformAndAccountId(
  userId: number,
  platform: string,
  accountId: string
) {
  return getDb().query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.userId, userId),
      eq(socialAccounts.platform, platform as "facebook" | "instagram" | "tiktok" | "threads"),
      eq(socialAccounts.accountId, accountId)
    ),
  });
}
