/**
 * Generate the Claude Desktop extension icon before mcpb pack.
 */
import { copyFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconPng = join(root, "icon.png");
const sourceSvg = join(root, "../../frontend/public/domytasks-reminders.svg");
const fallbackPng = join(root, "../../frontend/public/domytasks-icon-512.png");

function renderSvgWithQuickLook(svgPath, pngPath) {
  const outDir = mkdtempSync(join(tmpdir(), "domytasks-icon-"));
  const renderedPng = join(outDir, `${basename(svgPath)}.png`);
  try {
    execFileSync("qlmanage", ["-t", "-s", "512", "-o", outDir, svgPath], {
      stdio: "ignore",
    });
    if (!existsSync(renderedPng)) return false;
    copyFileSync(renderedPng, pngPath);
    return true;
  } catch {
    return false;
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

if (existsSync(sourceSvg) && renderSvgWithQuickLook(sourceSvg, iconPng)) {
  console.log("prepack: rendered domytasks-reminders.svg → icon.png");
  process.exit(0);
}

if (existsSync(fallbackPng)) {
  copyFileSync(fallbackPng, iconPng);
  console.log("prepack: copied domytasks-icon-512.png → icon.png");
  process.exit(0);
}

// 1x1 placeholder PNG if source unavailable
writeFileSync(
  iconPng,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);
console.log("prepack: wrote placeholder icon.png (logo sources not found)");
