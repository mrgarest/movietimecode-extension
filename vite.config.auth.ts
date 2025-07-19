import { defineConfig } from "vite";
import { buildDefineConfig } from "./vite.config";
import preact from "@preact/preset-vite";
const CONTENT_SCRIPTS = "/content";

export default defineConfig(
  buildDefineConfig({
    plugins: [preact()],
    input: {
      "wa": CONTENT_SCRIPTS + "/web/auth.ts",
    },
  })
);
