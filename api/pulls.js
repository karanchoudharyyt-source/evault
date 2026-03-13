export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const r = await fetch("https://api.courtyard.io/index/query/recent-pulls?limit=200", {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://courtyard.io",
        "Referer": "https://courtyard.io/",
      },
    });
    clearTimeout(timeout);
    if (!r.ok) return res.status(r.status).json({ error: `Courtyard API ${r.status}` });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message, type: e.name });
  }
}
