(() => {
  const frame = document.getElementById("feedwalls-widget");
  if (!frame) return;
  if (frame.getAttribute("data-fw-pending") === "true") return;
  if (!frame.getAttribute("src")) return;

  const allowedOrigins = new Set([
    "https://feedwalls.online",
    "https://www.feedwalls.online",
  ]);
  const MIN_HEIGHT = 360;
  const MAX_HEIGHT = 5000;

  addEventListener("message", (event) => {
    if (!allowedOrigins.has(event.origin)) return;
    if (event.source !== frame.contentWindow) return;
    if (!event.data || event.data.type !== "feedwalls:height") return;
    const height = Number(event.data.h);
    if (!Number.isFinite(height)) return;
    frame.style.height = Math.max(MIN_HEIGHT, Math.min(height, MAX_HEIGHT)) + "px";
  });
})();
