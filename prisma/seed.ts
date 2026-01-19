import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo host user
  const demoHost = await prisma.user.upsert({
    where: { email: "demo@paintsip.com" },
    update: {},
    create: {
      email: "demo@paintsip.com",
      name: "Demo Host",
      passwordHash: await hashPassword("demo123"),
      role: "HOST",
    },
  });
  console.log("✅ Created demo host:", demoHost.email);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@paintsip.com" },
    update: {},
    create: {
      email: "admin@paintsip.com",
      name: "Platform Admin",
      passwordHash: await hashPassword("admin123"),
      role: "ADMIN",
    },
  });
  console.log("✅ Created admin user:", adminUser.email);

  // Create sample canvases
  const canvases = [
    {
      id: "starry-night-reimagined",
      name: "Starry Night Reimagined",
      imageUrl:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
      tags: ["classic", "night", "beginner"],
    },
    {
      id: "sunset-beach",
      name: "Sunset Beach",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      tags: ["nature", "sunset", "beginner"],
    },
    {
      id: "abstract-florals",
      name: "Abstract Florals",
      imageUrl:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800",
      tags: ["flowers", "abstract", "intermediate"],
    },
    {
      id: "mountain-majesty",
      name: "Mountain Majesty",
      imageUrl:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
      tags: ["nature", "mountains", "intermediate"],
    },
    {
      id: "wine-and-grapes",
      name: "Wine & Grapes",
      imageUrl:
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
      tags: ["food", "wine", "beginner"],
    },
  ];

  for (const canvas of canvases) {
    await prisma.canvas.upsert({
      where: { id: canvas.id },
      update: canvas,
      create: canvas,
    });
  }
  console.log("✅ Created sample canvases");

  // Create a sample published event
  const sampleEvent = await prisma.event.upsert({
    where: { slug: "starry-night-wine-evening" },
    update: {},
    create: {
      hostId: demoHost.id,
      title: "Starry Night Wine Evening",
      description:
        "Join us for a magical evening of painting Van Gogh's iconic Starry Night while enjoying fine wines and great company. No experience necessary – our instructor will guide you step by step!",
      slug: "starry-night-wine-evening",
      startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDateTime: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
      ),
      locationName: "The Art Loft Studio",
      address: "123 Creative Way",
      city: "Austin",
      state: "TX",
      zip: "78701",
      ticketPriceCents: 4500,
      capacity: 24,
      salesCutoffHours: 48,
      refundPolicyText:
        "Full refunds available up to 72 hours before the event. 50% refund between 72-48 hours. No refunds within 48 hours of the event.",
      canvasImageUrl:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
      status: "PUBLISHED",
    },
  });
  console.log("✅ Created sample event:", sampleEvent.title);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Demo credentials:");
  console.log("   Host: demo@paintsip.com / demo123");
  console.log("   Admin: admin@paintsip.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });