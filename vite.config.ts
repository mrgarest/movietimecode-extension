import { AliasOptions, defineConfig, PluginOption, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import getManifest from "./manifest.config";
import { viteStaticCopy } from "vite-plugin-static-copy";
import config from "./config.json";

const banner: string = `/**
 * Movie Timecode Browser Extension
 * Release date: ${new Date().toISOString().split("T")[0]}
 * @version ${config.version}
 * @author Garest
 * @link ${config.homepageUrl}
 * @license MIT
 */`;

const alias: AliasOptions = {
  "@": path.resolve(__dirname, "."),
  config: path.resolve(__dirname, "config.json"),
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: "LICENSE",
          dest: "",
        },
        {
          src: "assets/*",
          dest: "",
        },
        {
          src: "locales/*",
          dest: "_locales",
        },
      ],
    }),
    {
      name: "vite-plugin-manifest",
      apply: "build",
      generateBundle(_, _bundle) {
        const manifestJson = JSON.stringify(getManifest(), null, 2);

        this.emitFile({
          type: "asset",
          fileName: path.join("", "manifest.json"),
          source: manifestJson,
        });
      },
    },
  ],
  resolve: {
    alias: alias,
  },
  build: {
    rollupOptions: {
      output: {
        banner: banner,
      },
    },
  },
});

type TBuildDefineConfig = {
  plugins?: PluginOption[];
  input: Record<string, string>;
};

export const buildDefineConfig = (options: TBuildDefineConfig): UserConfig => {
  return {
    plugins: options.plugins,
    resolve: {
      alias: alias,
    },
    build: {
      emptyOutDir: false,
      rollupOptions: {
        input: options.input,
        output: {
          entryFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
          banner: banner,
        },
      },
    },
  };
};
