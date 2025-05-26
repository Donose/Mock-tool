chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "MOCKS_CHANGED") return;
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    padding: "8px 12px",
    background: "#333",
    color: "#fff",
    borderRadius: "4px",
    zIndex: "9999",
    fontFamily: "sans-serif"
  });
  toast.textContent = `Active mocks: ${msg.count}`;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3000);
});
