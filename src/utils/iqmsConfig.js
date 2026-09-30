// Reads public/config.js (window.IQMS_CONFIG) at call time so a server
// edit to that file applies on refresh, without a new build.

function readIqmsConfig() {
  const cfg = typeof window !== "undefined" ? window.IQMS_CONFIG : null;
  if (!cfg || typeof cfg !== "object") {
    throw new Error(
      "IQMS_CONFIG is missing. Set sampoornaBase, ivrsApiBase, and apiToken in config.js."
    );
  }

  const sampoornaBase = String(cfg.sampoornaBase || "").trim().replace(/\/+$/, "");
  const ivrsApiBase = String(cfg.ivrsApiBase || "").trim().replace(/\/+$/, "");
  const apiToken = cfg.apiToken != null ? String(cfg.apiToken).trim() : "";

  if (!sampoornaBase || !ivrsApiBase || !apiToken) {
    throw new Error(
      "IQMS_CONFIG must set sampoornaBase, ivrsApiBase, and apiToken in config.js."
    );
  }

  return { sampoornaBase, ivrsApiBase, apiToken };
}

export function sampoornaUrl(path = "") {
  const { sampoornaBase } = readIqmsConfig();
  if (!path) return sampoornaBase;
  const suffix = String(path).startsWith("/") ? String(path) : `/${path}`;
  return `${sampoornaBase}${suffix}`;
}

export function ivrsUrl(query = "") {
  const { ivrsApiBase } = readIqmsConfig();
  if (!query) return ivrsApiBase;
  const q = String(query).startsWith("?") ? String(query) : `?${query}`;
  return `${ivrsApiBase}${q}`;
}

export function getApiToken() {
  return readIqmsConfig().apiToken;
}
