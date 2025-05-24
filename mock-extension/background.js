const MOCK_SERVER_URL = "http://localhost:4000/__active_mocks";
let lastRuleHash = null;
let lastConnectionStatus = null;

chrome.runtime.onInstalled.addListener(() => {
  setInterval(updateRules, 1000); // every 1s
});

async function updateRules() {
  try {
    const res = await fetch(MOCK_SERVER_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const mocks = await res.json();
    chrome.storage.local.set({ mockCount: mocks.length }); // ✅ fixed: after fetch

    const ruleHash = JSON.stringify(mocks.map(m => m.url + m.method)).hashCode();
    if (ruleHash !== lastRuleHash) {
      lastRuleHash = ruleHash;

      const rules = mocks.map((mock, i) => ({
        id: i + 1,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: `http://localhost:4000${mock.url}`
          }
        },
        condition: {
          urlFilter: `*://uat-public-ubiservices.ubi.com${mock.url}`,
          resourceTypes: ["xmlhttprequest"]
        }
      }));

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules
      });

      console.log("[MOCK] Rules updated:", rules.length);
    }

    if (lastConnectionStatus !== true) {
      lastConnectionStatus = true;
      chrome.storage.local.set({ mockConnected: true });
    }

  } catch (err) {
    if (lastConnectionStatus !== false) {
      lastConnectionStatus = false;
      chrome.storage.local.set({ mockConnected: false });
    }
  }
}

// simple hash function for rule comparison
String.prototype.hashCode = function () {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    hash = ((hash << 5) - hash + this.charCodeAt(i)) | 0;
  }
  return hash;
};
