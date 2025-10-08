export const LINK_EXTRACTION_CONFIGS = [
  {
    selectors: ["#spec1"],
    getUrl: (el) => {
      const id = el.id;
      if (!id) return null;
      const scripts = Array.from(document.querySelectorAll("script"));
      for (const script of scripts) {
        const regex = new RegExp(
          `document\\.getElementById\\(["']${id}["']\\)\\.addEventListener\\(["']click["'],\\s*function\\s*\\(\\)\\s*\\{\\s*window\\.location\\.href\\s*=\\s*["']([^"']+)["']`,
          "m",
        );
        const m = script.textContent.match(regex);
        if (m) return m[1];
      }
      return null;
    },
    request: null,
  },
  {
    selectors: [
      'a[rel~="external"][rel~="noopener"][rel~="nofollow"]',
      '.post-wrapper a[rel~="external"][rel~="noopener"][rel~="noreferrer"]',
      'a.dw[target="_blank"]',
      'a.external[target="_blank"]',
      'a.postlink:not([href*="mobilism.org"])',
      "div.quote>a",
      'a:has(img[src*="download"])',
    ],
    getUrl: (el) => el.href,
    request: null,
  },
  {
    selectors: [".download-link[data-link]"],
    getUrl: (el) => el.getAttribute("data-link"),
    request: {
      method: "POST",
      url: "/wp-admin/admin-ajax.php?action=ajaxs_action&jxs_act=get_download_url_item",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: (link) => `link=${encodeURIComponent(link)}`,
      parseResponse: (response) => {
        try {
          const json = JSON.parse(response.responseText);
          return Object.values(json);
        } catch {
          return [];
        }
      },
    },
  },
  {
    selectors: ['a[href*="ouo.io"][href*="s="]'],
    getUrl: (el) => {
      const url = new URL(el.href);
      return url.searchParams.get("s");
    },
    request: {
      method: "GET",
      url: (link) => link,
      headers: {},
      parseResponse: (response) => {
        if (response.status !== 200 && response.finalUrl) {
          console.log(
            "[ouo.io] Non-200 status redirect detected:",
            response.finalUrl,
          );
          return [response.finalUrl];
        }

        if (response.status === 200 && response.finalUrl) {
          console.log("[ouo.io] Status 200 response, checking for JS redirect");

          const jsRedirectMatch = response.responseText.match(
            /=\s*\{\s*"url"\s*:\s*"([^"]+)"/,
          );
          console.log("[ouo.io] JS redirect match:", jsRedirectMatch);

          if (jsRedirectMatch) {
            const redirectUrl = jsRedirectMatch[1].replace(/\\\//g, "/");
            console.log("[ouo.io] Extracted JS redirect URL:", redirectUrl);
            return [redirectUrl];
          }

          try {
            const finalUrlObj = new URL(response.finalUrl);
            if (
              !finalUrlObj.hostname.includes("warmazon.com") &&
              !finalUrlObj.hostname.includes("magsguru.com") &&
              response.finalUrl !== response.responseURL
            ) {
              console.log(
                "[ouo.io] Looks like automatic redirect to external domain:",
                response.finalUrl,
              );
              return [response.finalUrl];
            }
          } catch (e) {
            console.log("[ouo.io] URL parsing error:", e);
          }
        }

        console.log("[ouo.io] No redirect found, returning empty array");
        return [];
      },
    },
  },
  {
    selectors: [
      'a[href*="/engine/go.php?url="]',
      'a[href^="/go/"]',
      ".vk-att-item a",
      "a.maxbutton-download-link",
    ],
    getUrl: (el) => el.href,
    request: {
      method: "GET",
      url: (link) => link,
      headers: {
        Referer: window.location.origin,
      },
      parseResponse: (response) => {
        const redirected =
          response.finalUrl && response.finalUrl !== response.responseURL
            ? response.finalUrl
            : null;
        return redirected ? [redirected] : [];
      },
    },
  },
  {
    selectors: ['form[action*="Fetching_Resource.php"]'],
    getUrl: (el) => el,
    request: {
      method: "POST",
      url: (form) => form.action,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: (form) => {
        return Array.from(form.elements)
          .filter((e) => e.name)
          .map(
            (e) =>
              encodeURIComponent(e.name) + "=" + encodeURIComponent(e.value),
          )
          .join("&");
      },
      parseResponse: (response) => {
        const match = response.responseText.match(
          /<meta\s+http-equiv=["']Refresh["']\s+content=["'][^;]+;url=([^"']+)["']/i,
        );
        return match ? [match[1]] : [];
      },
    },
  },
];
