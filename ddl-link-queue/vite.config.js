import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";

import {
  name,
  license,
  version,
  description,
  author,
  repository,
} from "./package.json";

export default defineConfig({
  plugins: [
    Userscript({
      fileName: name,
      entry: "src/index.js",
      header: {
        name: "DDL Link Queue",
        namespace: "https://greasyfork.org/",
        version,
        description,
        author: author.name,
        license,
        source: repository.url,
        supportURL: repository.url,
        match: [
          "https://*.4kw.in/*",
          "https://*.wowebook.org/*",
          "https://*.wowebook.ws/*",
          "https://*.downmagaz.net/*",
          "https://*.sanet.st/*",
          "https://*.magsguru.com/*",
          "https://*.pdfmagaz.in/*",
          "https://*.worldmags.net/*",
          "https://*.magazinelib.com/*",
          "https://*.oceanofpdf.com/*",
          "https://*.freemagazines.top/*",
          "https://*.pdfdude.com/*",
          "https://*.pdf-magazines-download.com/*",
          "https://*.pdf-magazines-archive.com/*",
          "https://*.magdownload.org/*",
          "https://*.warmazon.com/*",
          "https://*.avxhm.se/*",
          "https://*.zavat.pw/*",
          "https://*.scnlog.me/*",
          "https://*.forum.mobilism.org/*",
        ],
        connect: [
          "nfile.cc",
          "novafile.org",
          "turbobit.net",
          "tbit.to",
          "vk.com",
          "rapidgator.net",
          "ddownload.com",
          "nitroflare.com",
          "limewire.com",
          "uploadmall.com",
          "1fichier.com",
          "icerbox.com",
          "wowebook.ws",
        ],
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
