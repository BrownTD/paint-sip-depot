import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import * as QRCode from "qrcode";
import { getAbsoluteUrl } from "@/lib/utils";

const BG_COLOR = "#ffffff";
const QR_COLOR = "#000000";
const FINDER_COLOR = "#000000";
const BORDER = 4;
const MODULE_RADIUS_RATIO = 0.38;
const CANVAS_SIZE = 250;
const FINDER_SIZE = 7;
const LOGO_BOX_SIZE = 84;
const LOGO_PADDING = 0;
const LOGO_CORNER_RADIUS = 25;
const LOGO_QR_CLEARANCE = 7;
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

function buildQrModules(modules: number, moduleSize: number, quietZone: number, qr: QRCode.QRCode) {
  const radius = moduleSize * MODULE_RADIUS_RATIO;
  const artModules: string[] = [];
  const finderModules: string[] = [];
  const logoBoxX = (CANVAS_SIZE - LOGO_BOX_SIZE) / 2;
  const logoBoxY = (CANVAS_SIZE - LOGO_BOX_SIZE) / 2;
  const logoClearX = logoBoxX - LOGO_QR_CLEARANCE;
  const logoClearY = logoBoxY - LOGO_QR_CLEARANCE;
  const logoClearRight = logoBoxX + LOGO_BOX_SIZE + LOGO_QR_CLEARANCE;
  const logoClearBottom = logoBoxY + LOGO_BOX_SIZE + LOGO_QR_CLEARANCE;

  for (let rowIndex = 0; rowIndex < modules; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < modules; columnIndex += 1) {
      if (!qr.modules.get(rowIndex, columnIndex)) {
        continue;
      }

      const x = quietZone + columnIndex * moduleSize;
      const y = quietZone + rowIndex * moduleSize;
      const moduleRight = x + moduleSize;
      const moduleBottom = y + moduleSize;

      const overlapsLogoBox =
        x < logoClearRight &&
        moduleRight > logoClearX &&
        y < logoClearBottom &&
        moduleBottom > logoClearY;

      if (overlapsLogoBox) {
        continue;
      }

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
    artModules: artModules.join(""),
    finderModules: finderModules.join(""),
  };
}

export async function generateEventQrCode(eventId: string, eventSlug: string) {
  const svgOutput = await buildQrSvg(getAbsoluteUrl(`/e/${eventSlug}`));

  if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`qr-codes/${eventId}.svg`, svgOutput, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/svg+xml",
    });

    return blob.url;
  }

  await mkdir(QR_CODE_DIR, { recursive: true });

  const fileName = `${eventId}.svg`;
  await writeFile(path.join(QR_CODE_DIR, fileName), svgOutput, "utf8");

  return `/qr-codes/${fileName}`;
}

export async function buildQrSvg(url: string) {
  const qr = QRCode.create(url, {
    errorCorrectionLevel: "H",
  });

  const modules = qr.modules.size;
  const totalModules = modules + BORDER * 2;
  const moduleSize = CANVAS_SIZE / totalModules;
  const quietZone = BORDER * moduleSize;
  const logoBoxX = (CANVAS_SIZE - LOGO_BOX_SIZE) / 2;
  const logoBoxY = (CANVAS_SIZE - LOGO_BOX_SIZE) / 2;
  const logoInnerSize = LOGO_BOX_SIZE - LOGO_PADDING * 2;
  const { markup, viewBox } = await loadLogoMarkup();
  const logoScale = Math.min(logoInnerSize / viewBox.width, logoInnerSize / viewBox.height);
  const logoWidth = viewBox.width * logoScale;
  const logoHeight = viewBox.height * logoScale;
  const logoX = logoBoxX + (LOGO_BOX_SIZE - logoWidth) / 2;
  const logoY = logoBoxY + (LOGO_BOX_SIZE - logoHeight) / 2;
  const { artModules, finderModules } = buildQrModules(modules, moduleSize, quietZone, qr);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
  <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${BG_COLOR}"/>
  <defs>
    <clipPath id="qr-logo-clip">
      <rect x="${logoX.toFixed(3)}" y="${logoY.toFixed(3)}" width="${logoWidth.toFixed(3)}" height="${logoHeight.toFixed(3)}" rx="${LOGO_CORNER_RADIUS}" ry="${LOGO_CORNER_RADIUS}"/>
    </clipPath>
  </defs>
  <g fill="${QR_COLOR}">
    ${artModules}
  </g>
  <g fill="${FINDER_COLOR}">
    ${finderModules}
  </g>
  <g clip-path="url(#qr-logo-clip)">
    <g transform="translate(${(logoX - viewBox.minX).toFixed(3)}, ${(logoY - viewBox.minY).toFixed(3)}) scale(${logoScale.toFixed(6)})">
      ${markup}
    </g>
  </g>
</svg>
`;
}
