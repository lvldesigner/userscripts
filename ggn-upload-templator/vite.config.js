import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";

import {
  license,
  version,
  description,
  author,
  repository,
} from "./package.json";

export default defineConfig({
  plugins: [
    Userscript({
      fileName: "ggn-upload-templator",
      entry: "src/index.js",
      header: {
        name: "GGn Upload Templator",
        namespace: "https://greasyfork.org/",
        version,
        description,
        author: author.name,
        license,
        source: repository.url,
        supportURL: repository.url,
        icon: "https://gazellegames.net/favicon.ico",
        match: "https://*.gazellegames.net/upload.php*",
      },
      server: {
        port: 3000,
      },
      esbuildTransformOptions: {
        minify: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
  },
});
