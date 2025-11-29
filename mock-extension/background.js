const PORT = 4000;
const ACTIVE_MOCKS_URL = 'https://localhost:4000/__active_mocks';
const HOSTS = {
  uat: ["uat-public-ubiservices.ubi.com", "uat-connect.ubisoft.com"],
  prod: ["public-ubiservices.ubi.com", "uat-connect.ubisoft.com"]
};

let lastRulesHash = "";
let lastMockCount = null;
let lastEnv = null;

async function syncRules() {
  const { mockingEnabled = true, redirectDomains = ["prod"] } =
    await chrome.storage.local.get(["mockingEnabled", "redirectDomains"]);

  if (!mockingEnabled) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1)
    });
    await chrome.storage.local.set({ mockCount: 0 });
    return;
  }

  const currentEnv = redirectDomains[0];
  const prefix = currentEnv === "uat" ? "uat-" : "";

  try {
    const res = await fetch(ACTIVE_MOCKS_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const mocks = await res.json();
    await chrome.storage.local.set({ mockCount: mocks.length });

    let ruleId = 1;
    const endpointSummary = {};
    const addRules = mocks.flatMap(mock => {
      if (!mock.url || !mock.method || !mock.endpointUrl) return [];

      const [mockPath] = mock.url.split("?");
      const finalEndpoint = `${prefix}${mock.endpointUrl}`;
      endpointSummary[finalEndpoint] = (endpointSummary[finalEndpoint] || 0) + 1;

      return [{
        id: ruleId++,
        priority: 1,
        action: { type: "redirect", redirect: { url: `https://localhost:${PORT}${mock.url}` } },
        condition: {
          urlFilter: `|https://${finalEndpoint}${mockPath}`,
          resourceTypes: ["xmlhttprequest"],
          requestMethods: [mock.method.toLowerCase()]
        }
      }];
    });

    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map(r => r.id),
      addRules
    });

    await chrome.storage.local.set({ endpointSummary });

    const mockCountChanged = lastMockCount !== mocks.length;
const envChanged = lastEnv !== currentEnv;

if (mockCountChanged || envChanged) {
  chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
    for (const tab of tabs) {
      if (!/^https?:/.test(tab.url)) continue;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (count, env) => {
            const toast = document.createElement('div');
            Object.assign(toast.style, {
              position: 'fixed', bottom: '16px', right: '16px',
              padding: '8px 12px', background: '#333', color: '#fff',
              borderRadius: '24px', zIndex: '2147483647', fontFamily: 'sans-serif',
            });
            toast.textContent = `Active mocks: ${count} On Environment: (${env})`;
            document.body.append(toast);
            setTimeout(() => toast.remove(), 3000);
          },
          args: [mocks.length, currentEnv.toUpperCase()]
        });
      } catch (err) {
        console.warn('Toast injection failed for tab', tab.id, err);
      }
    }
  });
  lastMockCount = mocks.length;
  lastEnv = currentEnv;
}
  } catch (err) {
    console.error("Failed to sync rules:", err);
    await chrome.storage.local.set({ mockCount: 0 });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  syncRules();
  chrome.alarms.create("sync", { periodInMinutes: 0.1 });
});

chrome.runtime.onStartup.addListener(() => {
  syncRules();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "sync") syncRules();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg === "syncNow") syncRules();
});