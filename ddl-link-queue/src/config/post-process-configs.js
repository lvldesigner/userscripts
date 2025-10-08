import { makeRequest } from "../utils/http.js";

export const POST_PROCESS_CONFIGS = [
  {
    pattern: /vk\.com\/doc\d+/,
    name: "VK Document URL Extractor",
    process: async (link) => {
      console.log(`[Post-Process] Processing VK document link: ${link}`);
      
      const response = await makeRequest({
        method: "GET",
        url: link,
        headers: {},
      });

      if (!response || !response.responseText) {
        console.log(`[Post-Process] Failed to fetch VK document page`);
        return null;
      }

      const match = response.responseText.match(/"docUrl"\s*:\s*"(https?:\\\/\\\/[^"]+)"/);
      
      if (match) {
        const extractedUrl = match[1].replace(/\\\//g, "/");
        console.log(`[Post-Process] Extracted VK docUrl: ${extractedUrl}`);
        return extractedUrl;
      }

      console.log(`[Post-Process] No docUrl found in VK document page`);
      return null;
    },
  },
];
