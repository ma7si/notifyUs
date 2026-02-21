import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccount } from "@/lib/api-auth";
import { z } from "zod";

const segmentSchema = z.object({
  name: z.string().min(1),
  rules: z.array(
    z.object({
      field: z.string(),
      operator: z.enum(["in", "not_in", "eq", "contains"]),
      value: z.array(z.string()),
    })
  ).optional().default([]),
});

export async function GET(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segments = await prisma.segment.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    include: {
      rules: true,
      _count: { select: { notificationSegments: true } },
    },
  });

  return NextResponse.json({ data: segments });
}

export async function POST(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, rules } = segmentSchema.parse(body);

    const segment = await prisma.segment.create({
      data: {
        name,
        accountId: account.id,
        rules: {
          create: rules.map((r) => ({
            field: r.field,
            operator: r.operator,
            value: r.value,
          })),
        },
      },
      include: { rules: true },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
