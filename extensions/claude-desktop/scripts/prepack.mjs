/**
 * Copy DoMyTasks app icon into icon.png before mcpb pack.
 */
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconPng = join(root, "icon.png");
const sourceIcon = join(root, "../../frontend/public/domytasks-icon-512.png");

if (existsSync(sourceIcon)) {
  copyFileSync(sourceIcon, iconPng);
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
console.log("prepack: wrote placeholder icon.png (domytasks-icon-512.png not found)");
