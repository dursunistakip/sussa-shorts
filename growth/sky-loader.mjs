// Loads the website's horoscope engine (src/lib/sky.ts, horo-i18n.ts) in plain Node: copies them with Node-friendly imports
// into growth/.cache and imports them (Node 23.6+ strips TypeScript types natively).
import fs from "fs"; import path from "path"; import { fileURLToPath, pathToFileURL } from "url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export async function loadSky() {
  const cache = path.join(ROOT, "growth", ".cache"); fs.mkdirSync(cache, { recursive: true });
  const fix = (s) => s
    .replace(/import (\w+) from "@\/data\/horo\/(\w+)\.json";/g, (_, v, l) => `import ${v} from "${pathToFileURL(path.join(ROOT, "src/data/horo", l + ".json")).href}" with { type: "json" };`)
    .replace(/from "\.\/tarot-i18n";/g, `from "./tarot-i18n.ts";`);
  fs.writeFileSync(path.join(cache, "sky.ts"), fix(fs.readFileSync(path.join(ROOT, "src/lib/sky.ts"), "utf8")));
  fs.writeFileSync(path.join(cache, "horo-i18n.ts"), fix(fs.readFileSync(path.join(ROOT, "src/lib/horo-i18n.ts"), "utf8")));
  fs.writeFileSync(path.join(cache, "tarot-i18n.ts"), "export type Lang = string;\n");
  const sky = await import(pathToFileURL(path.join(cache, "sky.ts")).href);
  const { HORO_UI } = await import(pathToFileURL(path.join(cache, "horo-i18n.ts")).href);
  return { ...sky, HORO_UI };
}
