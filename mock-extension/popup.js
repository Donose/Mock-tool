document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("mockCount");

  chrome.storage.local.get(["mockConnected", "mockCount", "redirectDomains"], (result) => {
    const connected = result.mockConnected === true;
    statusEl.textContent = connected ? "✅ Connected" : "❌ Not connected";
    statusEl.className = connected ? "connected" : "disconnected";

    countEl.textContent = typeof result.mockCount === "number" ? result.mockCount : "–";

    const active = result.redirectDomains?.[0] || "uat";
    document.getElementById("uatToggle").checked = active === "uat";
    document.getElementById("prodToggle").checked = active === "prod";
  });

  ["uatToggle", "prodToggle"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      const selected = id === "uatToggle" ? "uat" : "prod";
      chrome.storage.local.set({ redirectDomains: [selected] });
    });
  });
});
