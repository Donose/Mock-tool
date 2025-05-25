const MOCK_SERVER_URL = "http://localhost:4000/__active_mocks";
const ALL_DOMAINS = {
  uat:  "uat-public-ubiservices.ubi.com",
  prod: "public-ubiservices.ubi.com"
};

let lastHash = null;

chrome.runtime.onInstalled.addListener(() => setInterval(syncRules, 1000));

async function syncRules() {
  try {
    const res = await fetch(MOCK_SERVER_URL);
    if (!res.ok) throw new Error("mock server " + res.status);
    const mocks = await res.json();

    chrome.storage.local.set({ mockCount: mocks.length });

    const { redirectDomains = ["uat"] } =
      await chrome.storage.local.get("redirectDomains");
    const hosts = redirectDomains.map(d => ALL_DOMAINS[d]);

    // ── hash so we only touch DNR when something actually changed
    const newHash = JSON.stringify({ mocks, hosts });
    if (newHash === lastHash) {
      chrome.storage.local.set({ mockConnected: true });
      return;
    }
    lastHash = newHash;

    // ── build rules (skip invalid / inactive)
    let id = 1;
    const rules = [];
    for (const m of mocks) {
      if (!m.url?.startsWith("/") || !m.method) {
        console.warn("[SKIP] bad mock:", m);
        continue;
      }
      for (const h of hosts) {
        rules.push({
          id: id++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { url: `http://localhost:4000${m.url}` }
          },
          condition: {
            urlFilter: `*://${h}${m.url}*`,          // ← allow anything after path
            resourceTypes: [
              "xmlhttprequest",
              "main_frame",
              "sub_frame",
              "other"
            ]
          }
        });
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    });

    console.log("[MOCK] applied", rules.length, "rules");
    chrome.storage.local.set({ mockConnected: true });

  } catch (e) {
    console.warn("[MOCK] update failed:", e.message);
    chrome.storage.local.set({ mockConnected: false });
  }
}

// tiny helper for the hash
String.prototype.hashCode = function () {
  let h = 0;
  for (let i = 0; i < this.length; i++)
    h = (h << 5) - h + this.charCodeAt(i) | 0;
  return h;
};
