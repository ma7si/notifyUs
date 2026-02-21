import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  plan: z.string().optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const eventSchema = z.object({
  event: z.string().min(1),
  user: userSchema,
});

export async function POST(req: NextRequest) {
  // API key auth
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  const account = await prisma.account.findUnique({ where: { apiKey } });
  if (!account) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { event, user } = eventSchema.parse(body);

    // Upsert the end user
    const attrs: Record<string, unknown> = { ...user };
    await prisma.endUser.upsert({
      where: {
        accountId_externalId: {
          accountId: account.id,
          externalId: user.id,
        },
      },
      update: {
        email: user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributes: attrs as any,
        updatedAt: new Date(),
      },
      create: {
        accountId: account.id,
        externalId: user.id,
        email: user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributes: attrs as any,
      },
    });

    console.log(
      `[NotifyUs] Event "${event}" from user ${user.id} on account ${account.id}`
    );

    return NextResponse.json({ received: true, event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Events error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
