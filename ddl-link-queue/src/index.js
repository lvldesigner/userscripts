import style from "./style.css?raw";
import {
  initToastContainer,
  showToast,
  formatQueueSizeToast,
} from "./utils/toast.js";
import { getQueue } from "./utils/queue.js";
import { initKeybindings } from "./ui/keybindings.js";

GM_addStyle(style);

initToastContainer();

initKeybindings();

setTimeout(async () => {
  const queue = await getQueue();
  const keybindings = [
    "Alt+L: Fetch links from page",
    "Alt+K: Copy queue to clipboard",
    "Ctrl+Alt+L: Clear queue",
  ].join("\n");
  showToast(
    `DDL Link Queue loaded.${formatQueueSizeToast(queue)}<br><br>${keybindings}`,
    "info",
    9000,
  );
}, 500);
