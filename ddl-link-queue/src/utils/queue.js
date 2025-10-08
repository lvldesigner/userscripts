const QUEUE_KEY = "redirectQueue";

export async function getQueue() {
  return await GM_getValue(QUEUE_KEY, []);
}

export async function setQueue(arr) {
  await GM_setValue(QUEUE_KEY, arr);
}

export async function clearQueue() {
  await setQueue([]);
}
