import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import * as QRCode from "qrcode";
import sharp from "sharp";
import { getAbsoluteUrl } from "@/lib/utils";

const BG_COLOR = "#ffffff";
const FINDER_COLOR = "#000000";
const BORDER = 4;
const MODULE_RADIUS_RATIO = 0.38;
const CANVAS_SIZE = 250;
const FINDER_SIZE = 7;
const LOGO_PATH = path.join(process.cwd(), "public", "logoSquare.svg");
const QR_CODE_DIR = path.join(process.cwd(), "public", "qr-codes");

function isFinderModule(rowIndex: number, columnIndex: number, modules: number) {
  const finderOrigins = [
    [0, 0],
    [0, modules - FINDER_SIZE],
    [modules - FINDER_SIZE, 0],
  ];

  return finderOrigins.some(
    ([startRow, startColumn]) =>
      rowIndex >= startRow &&
      rowIndex < startRow + FINDER_SIZE &&
      columnIndex >= startColumn &&
      columnIndex < startColumn + FINDER_SIZE
  );
}

async function loadLogoMarkup() {
  const svg = await readFile(LOGO_PATH, "utf8");
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/i);

  if (!viewBoxMatch) {
    throw new Error("logoSquare.svg is missing a viewBox attribute");
  }

  const [minX, minY, width, height] = viewBoxMatch[1]
    .replace(/,/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number);

  const markup = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();

  return {
    markup,
    viewBox: { minX, minY, width, height },
  };
}

function buildQrClipPaths(modules: number, moduleSize: number, quietZone: number, qr: QRCode.QRCode) {
  const radius = moduleSize * MODULE_RADIUS_RATIO;
  const artModules: string[] = [];
  const finderModules: string[] = [];

  for (let rowIndex = 0; rowIndex < modules; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < modules; columnIndex += 1) {
      if (!qr.modules.get(rowIndex, columnIndex)) {
        continue;
      }

      const x = quietZone + columnIndex * moduleSize;
      const y = quietZone + rowIndex * moduleSize;

      const roundedRect = `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${moduleSize.toFixed(3)}" height="${moduleSize.toFixed(3)}" rx="${radius.toFixed(3)}" ry="${radius.toFixed(3)}"/>`;
      const squareRect = `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${moduleSize.toFixed(3)}" height="${moduleSize.toFixed(3)}"/>`;

      if (isFinderModule(rowIndex, columnIndex, modules)) {
        finderModules.push(squareRect);
      } else {
        artModules.push(roundedRect);
      }
    }
  }

  return {
    artClip: artModules.join(""),
    finderClip: finderModules.join(""),
  };
}

export async function generateEventQrCode(eventId: string, eventSlug: string) {
  const qr = QRCode.create(getAbsoluteUrl(`/e/${eventSlug}`), {
    errorCorrectionLevel: "H",
  });

  const modules = qr.modules.size;
  const totalModules = modules + BORDER * 2;
  const moduleSize = CANVAS_SIZE / totalModules;
  const quietZone = BORDER * moduleSize;
  const { markup, viewBox } = await loadLogoMarkup();
  const { artClip, finderClip } = buildQrClipPaths(modules, moduleSize, quietZone, qr);
  const svgOutput = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
  <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${BG_COLOR}"/>
  <defs>
    <clipPath id="qr-art-clip">
      ${artClip}
    </clipPath>
    <clipPath id="qr-finder-clip">
      ${finderClip}
    </clipPath>
  </defs>
  <g clip-path="url(#qr-art-clip)">
    <g transform="translate(${-viewBox.minX}, ${-viewBox.minY}) scale(${CANVAS_SIZE / viewBox.width}, ${CANVAS_SIZE / viewBox.height})">
      ${markup}
    </g>
  </g>
  <g clip-path="url(#qr-finder-clip)">
    <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${FINDER_COLOR}"/>
  </g>
</svg>
`;
  const pngOutput = await sharp(Buffer.from(svgOutput, "utf8"))
    .png()
    .toBuffer();

  if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`qr-codes/${eventId}.png`, pngOutput, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
    });

    return blob.url;
  }

  await mkdir(QR_CODE_DIR, { recursive: true });

  const fileName = `${eventId}.png`;
  await writeFile(path.join(QR_CODE_DIR, fileName), pngOutput);

  return `/qr-codes/${fileName}`;
}
