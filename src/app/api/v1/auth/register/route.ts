import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    // Check if email already exists
    const existing = await prisma.authUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Create account + auth user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: { name },
      });

      const user = await tx.authUser.create({
        data: {
          name,
          email,
          password: hashed,
          accountId: account.id,
        },
      });

      return { account, user };
    });

    return NextResponse.json(
      {
        id: result.user.id,
        email: result.user.email,
        accountId: result.account.id,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
