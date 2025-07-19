import type { Manifest } from "webextension-polyfill-ts";
import config from "./config.json";

const icon = (size: number) => `/icons/${size}.png`;

export default function getManifest() {
  const baseUrl = config.baseUrl.replace(/^https?:\/\//, "*://*.");
  return {
    name: "__MSG_appName__",
    description: "__MSG_appDesc__",
    author: "Garest",
    version: config.version,
    manifest_version: 3,
    default_locale: "uk",
    homepage_url: config.homepageUrl,
    action: {
      default_icon: icon(128),
      default_title: "__MSG_appName__",
    },
    icons: {
      16: icon(16),
      48: icon(48),
      128: icon(128),
    },
    host_permissions: [`${baseUrl}/*`, ...config.hostPermissions.caesura],
    content_scripts: [
      {
        matches: [
          ...config.hostPermissions.caesura,
          ...(config.debug === true ? ["*://localhost/*"] : []),
        ],
        js: ["assets/caesura.js"],
        css: ["assets/content.css"],
        run_at: "document_start",
      },
      {
        matches: [
          `${baseUrl}/auth/callback/*`,
          ...(config.debug === true ? ["*://localhost/auth/callback/*"] : []),
        ],
        js: ["assets/wa.js"],
        run_at: "document_start",
      },
    ],
    web_accessible_resources: [
      {
        resources: ["images/*", "icons/*"],
        matches: ["<all_urls>"],
      },
    ],
    background: {
      service_worker: "assets/background.js",
      type: "module",
    },
    permissions: ["scripting", "storage", "tabs"],
  } as Manifest.WebExtensionManifest;
}
