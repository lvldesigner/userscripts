export function makeRequest(config) {
  return new Promise((resolve) => {
    GM_xmlhttpRequest({
      method: config.method,
      url: config.url,
      headers: {
        Referer: window.location.href,
        ...config.headers,
      },
      data: config.data,
      onload: (response) => resolve(response),
      onerror: () => resolve(null),
    });
  });
}
