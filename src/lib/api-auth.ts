import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Get account from session (for dashboard routes)
 */
export async function getSessionAccount() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as { id?: string; accountId?: string };
  if (!user.accountId) return null;

  const account = await prisma.account.findUnique({
    where: { id: user.accountId },
  });

  return account;
}

/**
 * Get account from API key header (for REST API routes)
 */
export async function getApiKeyAccount(req: NextRequest) {
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) return null;

  const account = await prisma.account.findUnique({
    where: { apiKey },
  });

  return account;
}

/**
 * Try session first, then API key
 */
export async function getAccount(req: NextRequest) {
  const sessionAccount = await getSessionAccount();
  if (sessionAccount) return sessionAccount;
  return getApiKeyAccount(req);
}
