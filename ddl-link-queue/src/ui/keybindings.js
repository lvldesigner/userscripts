import { getQueue, clearQueue } from "../utils/queue.js";
import { showToast, formatQueuePreviewToast } from "../utils/toast.js";
import { copyQueueToClipboard } from "../utils/clipboard.js";
import { fetchRedirectedLinks } from "../core/link-fetcher.js";

const modState = { alt: false, ctrl: false, shift: false, meta: false };

export function initKeybindings() {
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Alt") modState.alt = true;
      if (e.key === "Control") modState.ctrl = true;
      if (e.key === "Shift") modState.shift = true;
      if (e.key === "Meta") modState.meta = true;

      if (e.key.toLowerCase() === "k") {
        if (modState.alt && !modState.shift && !modState.ctrl) {
          e.preventDefault();
          copyQueueToClipboard();
        }
      }

      if (e.key.toLowerCase() === "l") {
        if (modState.alt && !modState.ctrl && !modState.shift) {
          e.preventDefault();
          fetchRedirectedLinks();
        } else if (modState.alt && modState.shift && !modState.ctrl) {
          e.preventDefault();
          copyQueueToClipboard();
        } else if (modState.alt && modState.ctrl && !modState.shift) {
          e.preventDefault();
          clearQueue().then(() => {
            showToast("Queue cleared.", "success");
          });
        } else if (modState.alt && modState.ctrl && modState.shift) {
          e.preventDefault();
          (async () => {
            const queue = await getQueue();
            showToast(formatQueuePreviewToast(queue), "info", 7000);
          })();
        }
      }
    },
    true,
  );

  document.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Alt") modState.alt = false;
      if (e.key === "Control") modState.ctrl = false;
      if (e.key === "Shift") modState.shift = false;
      if (e.key === "Meta") modState.meta = false;
    },
    true,
  );
}
