import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { buildQrSvg } from "../src/lib/event-qr";

const EXAMPLE_URL = "https://www.paintsipdepot.com";
const OUTPUT_PATH = path.join(process.cwd(), "public", "Misc", "example.svg");

async function main() {
  const svg = await buildQrSvg(EXAMPLE_URL);

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, svg, "utf8");

  console.log(`Wrote ${OUTPUT_PATH} for ${EXAMPLE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
