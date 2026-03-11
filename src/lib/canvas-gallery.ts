import { readdir } from "fs/promises";
import path from "path";

export type CanvasGalleryItem = {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
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

export function getCanvasPreviewItems(
  sections: CanvasGallerySection[],
  limit = 5
): CanvasGalleryItem[] {
  return sections.flatMap((section) => section.items).slice(0, limit);
}
