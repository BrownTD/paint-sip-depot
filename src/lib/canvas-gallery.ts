import { readdir } from "fs/promises";
import { ProductStatus } from "@prisma/client";
import path from "path";
import { CANVASES_CATEGORY_ID } from "@/lib/product-catalog";
import { prisma } from "@/lib/prisma";

export type CanvasGalleryItem = {
  id: string;
  name: string;
  imageUrl: string;
  imageUrls?: string[];
  description?: string;
  category: string;
  colorOptions?: Array<{
    id: string;
    label: string;
    hex: string;
  }>;
};

export type CanvasGallerySection = {
  id: string;
  title: string;
  items: CanvasGalleryItem[];
};

const CANVAS_OPTIONS_DIR = path.join(process.cwd(), "public", "canvas-options");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDisplayName(filename: string) {
  const withoutExt = filename.replace(/\.[^.]+$/, "");

  return withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toPublicImageUrl(category: string, filename: string) {
  return `/canvas-options/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}

export async function getCanvasGallerySections(): Promise<CanvasGallerySection[]> {
  const sectionEntries = await readdir(CANVAS_OPTIONS_DIR, { withFileTypes: true });

  const sections = await Promise.all(
    sectionEntries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const category = entry.name;
        const categoryDir = path.join(CANVAS_OPTIONS_DIR, category);
        const fileEntries = await readdir(categoryDir, { withFileTypes: true });

        const items = fileEntries
          .filter((fileEntry) => fileEntry.isFile())
          .filter((fileEntry) => IMAGE_EXTENSIONS.has(path.extname(fileEntry.name).toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((fileEntry) => ({
            id: `${toSlug(category)}:${toSlug(fileEntry.name)}`,
            name: toDisplayName(fileEntry.name),
            imageUrl: toPublicImageUrl(category, fileEntry.name),
            imageUrls: [toPublicImageUrl(category, fileEntry.name)],
            category,
          }));

        return {
          id: toSlug(category),
          title: category,
          items,
        };
      })
  );

  return sections;
}

export async function getPaintKitCanvasGallerySections(): Promise<CanvasGallerySection[]> {
  const subcategories = await prisma.productSubcategory.findMany({
    where: {
      categoryId: CANVASES_CATEGORY_ID,
      products: {
        some: {
          status: ProductStatus.ACTIVE,
        },
      },
    },
    include: {
      products: {
        where: {
          status: ProductStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrls: true,
          colorOptions: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              label: true,
              hex: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return subcategories
    .map((subcategory) => ({
      id: subcategory.id,
      title: subcategory.name,
      items: subcategory.products
        .flatMap((product) => {
          const imageUrl = product.imageUrls[0];
          if (!imageUrl) {
            return [];
          }

          return [{
            id: product.id,
            name: product.name,
            imageUrl,
            imageUrls: product.imageUrls,
            description: product.description,
            category: subcategory.name,
            colorOptions: product.colorOptions,
          }];
        }),
    }))
    .filter((section) => section.items.length > 0);
}

export function getCanvasPreviewItems(
  sections: CanvasGallerySection[],
  limit = 5
): CanvasGalleryItem[] {
  return sections.flatMap((section) => section.items).slice(0, limit);
}
