const PORT = 4000; //comeback to this 
const ACTIVE_MOCKS_URL = 'https://localhost:4000/__active_mocks';
const HOSTS = { uat: "uat-public-ubiservices.ubi.com", prod: "public-ubiservices.ubi.com" };

let lastRulesHash = "";


// 2️⃣ Fetch active mocks, build & update DNR rules, store mockCount
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

  try {
    const res = await fetch(ACTIVE_MOCKS_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const mocks = await res.json();
    await chrome.storage.local.set({ mockCount: mocks.length });

    const hosts = redirectDomains.map(env => HOSTS[env] || HOSTS.prod);
    const hash = JSON.stringify({ mocks, hosts });
    if (hash === lastRulesHash) return;
    lastRulesHash = hash;

    const addRules = mocks.flatMap((mock, i) => {
      if (!mock.url || !mock.method) return [];
      return hosts.map(host => ({
        id: i + 1,
        priority: 1,
        action: { type: "redirect", redirect: { url: `https://localhost:${PORT}${mock.url}` } },
        condition: {
          urlFilter: `|https://${host}${mock.url}`,
          resourceTypes: ["xmlhttprequest"],
          requestMethods: [mock.method.toLowerCase()]
        }
      }));
    });

    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map(r => r.id),
      addRules
    });

    console.log(`[MOCK] Updated ${addRules.length} rules`);

    // In-page toast via scripting.executeScript to ensure injection
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
      for (const tab of tabs) {
        if (!/^https?:/.test(tab.url)) continue;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (count) => {
              const toast = document.createElement('div');
              Object.assign(toast.style, {
                position: 'fixed', bottom: '16px', right: '16px',
                padding: '8px 12px', background: '#333', color: '#fff',
                borderRadius: '4px', zIndex: '2147483647', fontFamily: 'sans-serif'
              });
              toast.textContent = `Active mocks: ${count}`;
              document.body.append(toast);
              setTimeout(() => toast.remove(), 3000);
            },
            args: [mocks.length]
          });
        } catch (err) {
          console.warn('Toast injection failed for tab', tab.id, err);
        }
      }
    });
  } catch (e) {
    console.warn("[MOCK] Sync error:", e);
  }
}

// 3️⃣ Schedule both tasks on install/startup
chrome.runtime.onInstalled.addListener(() => {
  syncRules();
  chrome.alarms.create("sync", { periodInMinutes: 0.1 });
});

chrome.runtime.onStartup.addListener(() => {
  syncRules();
});

// 4️⃣ Alarm handler
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "sync") syncRules();
});

// 5️⃣ Manual “syncNow” trigger (from popup)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg === "syncNow") syncRules();
});
