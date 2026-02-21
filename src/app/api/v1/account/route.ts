import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAccount } from "@/lib/api-auth";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
});

export async function GET() {
  const account = await getSessionAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const full = await prisma.account.findUnique({
    where: { id: account.id },
    include: { domains: true },
  });

  return NextResponse.json(full);
}

export async function PUT(req: NextRequest) {
  const account = await getSessionAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.account.update({
      where: { id: account.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Regenerate API key
export async function PATCH() {
  const account = await getSessionAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const newKey = "nfy_" + uuidv4().replace(/-/g, "");

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: { apiKey: newKey },
  });

  return NextResponse.json({ apiKey: updated.apiKey });
}
