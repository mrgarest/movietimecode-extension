import { defineConfig } from "vite";
import { buildDefineConfig } from "./vite.config";

export default defineConfig(
  buildDefineConfig({
    input: {
      background: "/background/background.ts",
    },
  })
);
