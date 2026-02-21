import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAccount } from "@/lib/api-auth";
import { z } from "zod";

const domainSchema = z.object({
  hostname: z.string().min(1).regex(/^[a-zA-Z0-9.-]+$/, "Invalid hostname"),
});

export async function POST(req: NextRequest) {
  const account = await getSessionAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { hostname } = domainSchema.parse(body);

    const domain = await prisma.domain.create({
      data: { accountId: account.id, hostname },
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid hostname" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const account = await getSessionAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Domain ID required" }, { status: 400 });

  const domain = await prisma.domain.findFirst({
    where: { id, accountId: account.id },
  });
  if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.domain.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
