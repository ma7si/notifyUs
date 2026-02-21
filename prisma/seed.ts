import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient: PC } = require("@prisma/client");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/notifyus",
});
const adapter = new PrismaPg(pool);
const prisma: PrismaClient = new PC({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.notificationClick.deleteMany();
  await prisma.notificationImpression.deleteMany();
  await prisma.notificationSegment.deleteMany();
  await prisma.notificationExclusion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.segmentRule.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.endUser.deleteMany();
  await prisma.session.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.authUser.deleteMany();
  await prisma.account.deleteMany();

  // Create demo account
  const account = await prisma.account.create({
    data: {
      name: "Acme Corp",
      apiKey: "nfy_demo_key_acme_corp_12345",
    },
  });

  console.log(`✅ Account created: ${account.name} (${account.id})`);

  // Create auth user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const authUser = await prisma.authUser.create({
    data: {
      name: "Demo User",
      email: "demo@notifyus.com",
      password: hashedPassword,
      accountId: account.id,
    },
  });

  console.log(`✅ Auth user created: ${authUser.email}`);

  // Create domain
  await prisma.domain.create({
    data: {
      accountId: account.id,
      hostname: "app.acmecorp.com",
    },
  });

  // Create segments
  const proSegment = await prisma.segment.create({
    data: {
      accountId: account.id,
      name: "Pro Users",
      rules: {
        create: [
          {
            field: "plan",
            operator: "in",
            value: ["pro", "enterprise"],
          },
        ],
      },
    },
  });

  const trialSegment = await prisma.segment.create({
    data: {
      accountId: account.id,
      name: "Trial Users",
      rules: {
        create: [
          {
            field: "tags",
            operator: "in",
            value: ["trial"],
          },
        ],
      },
    },
  });

  const adminSegment = await prisma.segment.create({
    data: {
      accountId: account.id,
      name: "Admins",
      rules: {
        create: [
          {
            field: "role",
            operator: "eq",
            value: ["admin"],
          },
        ],
      },
    },
  });

  console.log(`✅ Segments created: ${proSegment.name}, ${trialSegment.name}, ${adminSegment.name}`);

  // Create notifications
  const welcomeNotif = await prisma.notification.create({
    data: {
      accountId: account.id,
      name: "Welcome Banner",
      lang: "en",
      type: "banner",
      position: "top",
      status: "active",
      title: "Welcome to Acme!",
      body: "Get started with a <strong>free 14-day trial</strong>. No credit card required.",
      ctaText: "Get Started",
      ctaUrl: "https://acmecorp.com/onboarding",
      backgroundColor: "#1a1a2e",
      textColor: "#ffffff",
      ctaColor: "#e94560",
      isDismissable: true,
      isSticky: false,
      maxViewsPerUser: 3,
      repeatPolicy: "every_load",
    },
  });

  await prisma.notification.create({
    data: {
      accountId: account.id,
      name: "Feature Announcement - Dark Mode",
      lang: "en",
      type: "modal",
      position: "center",
      status: "active",
      title: "Dark Mode is Here! 🌙",
      body: "We just launched dark mode for the dashboard. Enable it in your settings to reduce eye strain during late-night sessions.",
      ctaText: "Try Dark Mode",
      ctaUrl: "https://acmecorp.com/settings?theme=dark",
      backgroundColor: "#0f172a",
      textColor: "#e2e8f0",
      ctaColor: "#6366f1",
      isDismissable: true,
      maxViewsPerUser: 1,
      repeatPolicy: "once",
      segments: {
        create: [{ segmentId: proSegment.id }],
      },
    },
  });

  await prisma.notification.create({
    data: {
      accountId: account.id,
      name: "Trial Expiry Warning",
      lang: "en",
      type: "toast",
      position: "top",
      status: "active",
      title: "Your trial ends in 3 days",
      body: "Upgrade now to keep access to all Pro features.",
      ctaText: "Upgrade Now",
      ctaUrl: "https://acmecorp.com/pricing",
      backgroundColor: "#7c3aed",
      textColor: "#ffffff",
      ctaColor: "#fbbf24",
      isDismissable: true,
      autoDismissSeconds: 8,
      maxViewsPerUser: 5,
      repeatPolicy: "every_load",
      segments: {
        create: [{ segmentId: trialSegment.id }],
      },
    },
  });

  await prisma.notification.create({
    data: {
      accountId: account.id,
      name: "Arabic Welcome Banner",
      lang: "ar",
      type: "banner",
      position: "top",
      status: "draft",
      title: "مرحباً بك في أكمي!",
      body: "ابدأ تجربتك المجانية لمدة 14 يوماً. لا يلزم بطاقة ائتمان.",
      ctaText: "ابدأ الآن",
      ctaUrl: "https://acmecorp.com/ar/onboarding",
      backgroundColor: "#064e3b",
      textColor: "#ffffff",
      ctaColor: "#10b981",
      isDismissable: true,
    },
  });

  await prisma.notification.create({
    data: {
      accountId: account.id,
      name: "Maintenance Notice",
      lang: "en",
      type: "banner",
      position: "top",
      status: "scheduled",
      title: "Scheduled Maintenance",
      body: "We'll be down for maintenance on Saturday, Feb 28 from 2–4 AM UTC.",
      backgroundColor: "#dc2626",
      textColor: "#ffffff",
      ctaColor: "#fca5a5",
      isDismissable: false,
      startsAt: new Date("2026-02-27T00:00:00Z"),
      endsAt: new Date("2026-02-28T04:00:00Z"),
    },
  });

  console.log(`✅ Notifications created: ${welcomeNotif.id}`);

  // Create some demo end users with impressions
  const endUser1 = await prisma.endUser.create({
    data: {
      accountId: account.id,
      externalId: "user-001",
      email: "alice@example.com",
      attributes: { plan: "pro", role: "admin", tags: ["power-user"] },
    },
  });

  const endUser2 = await prisma.endUser.create({
    data: {
      accountId: account.id,
      externalId: "user-002",
      email: "bob@example.com",
      attributes: { plan: "starter", role: "member", tags: ["trial"] },
    },
  });

  // Add sample impressions
  await prisma.notificationImpression.createMany({
    data: [
      { notificationId: welcomeNotif.id, userId: endUser1.id, viewCount: 3 },
      { notificationId: welcomeNotif.id, userId: endUser2.id, viewCount: 1 },
    ],
  });

  // Add sample clicks
  await prisma.notificationClick.createMany({
    data: [
      {
        notificationId: welcomeNotif.id,
        userId: endUser1.id,
        ctaUrlSnapshot: "https://acmecorp.com/onboarding",
      },
    ],
  });

  console.log("✅ Sample end users and analytics created");
  console.log("\n🎉 Seed complete!");
  console.log("\n📝 Demo credentials:");
  console.log("   Email: demo@notifyus.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
