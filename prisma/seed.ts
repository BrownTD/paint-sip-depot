import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database (canvases only)...");

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
      update: {
        name: canvas.name,
        imageUrl: canvas.imageUrl,
        tags: canvas.tags,
      },
      create: canvas,
    });
  }

  console.log(`✅ Seeded ${canvases.length} canvases`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });