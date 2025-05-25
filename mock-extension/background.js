const MOCK_SERVER_URL = "https://localhost:4000/__active_mocks";
const ALL_DOMAINS = {
  uat: "https://uat-public-ubiservices.ubi.com",
  prod: "https://public-ubiservices.ubi.com"
};

let lastRulesHash = null;

async function syncRules() {
  const { mockingEnabled = true, redirectDomains = ["prod"] } = await chrome.storage.local.get();
  if (!mockingEnabled) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1) });
    return;
  }

  try {
    const res = await fetch("https://localhost:4000/__active_mocks");
    if (!res.ok) throw new Error("Server returned " + res.status);
    const mocks = await res.json();

    const hosts = redirectDomains.map(d =>
      d === "uat"
        ? "uat-public-ubiservices.ubi.com"
        : "public-ubiservices.ubi.com"
    );

    const hash = JSON.stringify({ mocks, hosts });
    if (hash === lastRulesHash) return; // ✅ Do nothing if nothing changed
    lastRulesHash = hash;

    let rules = [];
    let id = 1;
    mocks.forEach(mock => {
      if (!mock.url || !mock.method) return;
      hosts.forEach(host => {
        rules.push({
          id: id++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { url: `https://localhost:4000${mock.url}` }
          },
          condition: {
            urlFilter: `|https://${host}${mock.url}`, // "|" anchors to start of URL
            resourceTypes: ["xmlhttprequest"],
            requestMethods: [mock.method.toLowerCase()]
          }
        });
      });
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    });

    console.log("[MOCK] Updated", rules.length, "rules");
  } catch (e) {
    console.warn("[MOCK] Sync error:", e.message);
  }
}


chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "syncNow") syncRules();
});

