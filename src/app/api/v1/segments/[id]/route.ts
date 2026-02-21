import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccount } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  rules: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum(["in", "not_in", "eq", "contains"]),
        value: z.array(z.string()),
      })
    )
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const segment = await prisma.segment.findFirst({
    where: { id, accountId: account.id },
    include: { rules: true },
  });

  if (!segment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(segment);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.segment.findFirst({
    where: { id, accountId: account.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const { name, rules } = updateSchema.parse(body);

    if (rules !== undefined) {
      await prisma.segmentRule.deleteMany({ where: { segmentId: id } });
    }

    const segment = await prisma.segment.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(rules !== undefined
          ? {
              rules: {
                create: rules.map((r) => ({
                  field: r.field,
                  operator: r.operator,
                  value: r.value,
                })),
              },
            }
          : {}),
      },
      include: { rules: true },
    });

    return NextResponse.json(segment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.segment.findFirst({
    where: { id, accountId: account.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.segment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
