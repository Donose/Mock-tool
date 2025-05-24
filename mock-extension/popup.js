document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("mockCount");

  chrome.storage.local.get(["mockConnected", "mockCount"], (result) => {
    const connected = result.mockConnected === true;
    statusEl.textContent = connected ? "✅ Connected" : "❌ Not connected";
    statusEl.style.color = connected ? "green" : "red";

    countEl.textContent = typeof result.mockCount === "number" ? result.mockCount : "–";
  });
});
