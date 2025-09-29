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
        version,
        description,
        author: author.name,
        license,
        source: repository.url,
        icon: "https://gazellegames.net/favicon.ico",
        match: "https://*.gazellegames.net/upload.php*",
        downloadURL:
          "https://update.greasyfork.org/scripts/550898/GGn%20Upload%20Templator.user.js",
        updateURL:
          "https://update.greasyfork.org/scripts/550898/GGn%20Upload%20Templator.user.js",
      },
      server: {
        port: 3000,
      },
      esbuildTransformOptions: {
        minify: false,
      },
    }),
  ],
});
