const HIDE_TOASTS = true;

export function initToastContainer() {
  if (!document.getElementById("ddl-toast-container")) {
    const container = document.createElement("div");
    container.id = "ddl-toast-container";
    document.body.appendChild(container);
  }
}

export function formatQueueSizeToast(queue) {
  return `<br><span style='font-size:18px;font-weight:bold;'>Queue size: ${queue.length}</span><br>`;
}

export function formatQueuePreviewToast(queue) {
  const sizeLine = `<span style='font-size:18px;font-weight:bold;'>Queue size: ${queue.length}</span>`;
  if (queue.length === 0) return `${sizeLine}<br>(Queue is empty)`;
  const preview = queue
    .slice(0, 4)
    .map((item, i) => {
      let truncated = item.length > 60 ? item.slice(0, 57) + "..." : item;
      return `<span style='font-size:13px;'>${i + 1}. ${truncated}</span>`;
    })
    .join("<br>");
  return `<br>${sizeLine}<br>${preview}${queue.length > 4 ? "<br>...and more" : ""}`;
}

export function showToast(msg, type = "info", timeout = 3000) {
  const container = document.getElementById("ddl-toast-container");
  const toast = document.createElement("div");
  toast.className = `ddl-toast ${type}`;
  toast.innerHTML = msg.replace(/\n/g, "<br>");
  container.appendChild(toast);
  if (HIDE_TOASTS) {
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => container.removeChild(toast), 400);
    }, timeout);
  }
}

export function createPersistentToast(msg, type = "warning") {
  const container = document.getElementById("ddl-toast-container");
  const toast = document.createElement("div");
  toast.className = `ddl-toast ${type}`;
  toast.innerHTML = msg;
  container.appendChild(toast);
  return toast;
}

export function removePersistentToast(toast) {
  if (toast && toast.parentNode) {
    toast.parentNode.removeChild(toast);
  }
}
