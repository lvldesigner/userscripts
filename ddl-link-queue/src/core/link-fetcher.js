import { LINK_EXTRACTION_CONFIGS } from "../config/link-configs.js";
import { getQueue, setQueue } from "../utils/queue.js";
import {
  showToast,
  formatQueueSizeToast,
  createPersistentToast,
  removePersistentToast,
} from "../utils/toast.js";
import { makeRequest } from "../utils/http.js";

export async function fetchRedirectedLinks() {
  const queue = await getQueue();
  let totalAdded = 0;

  const fetchingToast = createPersistentToast("Fetching links...", "warning");

  for (const config of LINK_EXTRACTION_CONFIGS) {
    const elements = config.selectors.flatMap((sel) =>
      Array.from(document.querySelectorAll(sel)),
    );
    for (const el of elements) {
      const link = config.getUrl(el);
      if (!link || queue.includes(link)) continue;
      if (!config.request) {
        queue.push(link);
        totalAdded++;
      } else {
        const response = await makeRequest({
          method: config.request.method,
          url:
            typeof config.request.url === "function"
              ? config.request.url(link)
              : config.request.url,
          headers: config.request.headers,
          data: config.request.data ? config.request.data(link) : undefined,
        });
        if (response) {
          const urls = config.request.parseResponse(response);
          for (const u of urls) {
            if (u && !queue.includes(u)) {
              queue.push(u);
              totalAdded++;
            }
          }
        }
      }
    }
  }

  removePersistentToast(fetchingToast);

  if (totalAdded > 0) {
    await setQueue(queue);
    showToast(
      `Added ${totalAdded} links.${formatQueueSizeToast(queue)}`,
      "success",
    );
  } else {
    showToast("No links found to add.", "error");
  }
}
