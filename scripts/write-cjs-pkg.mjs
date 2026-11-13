// The root package is "type": "module", so dist/cjs/*.js would be parsed as ESM without this.
// One 24-byte marker file makes `require("@fleet/sdk")` resolve into a real CommonJS subtree.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, "..", "dist", "cjs", "package.json"), JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
