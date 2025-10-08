import { getQueue } from "./queue.js";
import { showToast } from "./toast.js";

function groupQueueByHostname(queue) {
  const groups = {};
  for (const url of queue) {
    try {
      const hostname = new URL(url).hostname;
      if (!groups[hostname]) groups[hostname] = [];
      groups[hostname].push(url);
    } catch (e) {
      if (!groups["unknown"]) groups["unknown"] = [];
      groups["unknown"].push(url);
    }
  }
  return groups;
}

export async function copyQueueToClipboard() {
  const queue = await getQueue();
  if (queue.length === 0) {
    showToast("Queue is empty.", "error");
    return;
  }
  const groups = groupQueueByHostname(queue);
  const text = Object.values(groups)
    .map((urls) => urls.join("\n"))
    .join("\n\n");
  try {
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(text);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showToast("Queue copied to clipboard.", "success");
  } catch (e) {
    showToast("Failed to copy to clipboard.", "error");
  }
}
