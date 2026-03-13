export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  try {
    const r = await fetch("https://api.courtyard.io/index/query/recent-pulls?limit=200", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!r.ok) throw new Error("Courtyard API returned " + r.status);
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
