export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      "https://api.courtyard.io/index/query/recent-pulls?limit=200",
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Origin": "https://courtyard.io",
          "Referer": "https://courtyard.io/",
        },
      }
    );
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Courtyard API ${response.status}`, body: text.slice(0, 200) });
    }
    const data = await response.json();
    // Cache 30s on CDN, serve stale for 10s while revalidating
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=10");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message, type: error.name });
  } finally {
    clearTimeout(timeout);
  }
}
