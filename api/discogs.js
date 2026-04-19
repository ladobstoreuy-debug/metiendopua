export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
  if (!DISCOGS_TOKEN) {
    return res.status(500).json({ error: "DISCOGS_TOKEN not configured in Vercel environment variables." });
  }

  const { action, page, per_page, sort, sort_order, id, q } = req.query;

  const dHeaders = {
    "Authorization": `Discogs token=${DISCOGS_TOKEN}`,
    "User-Agent": "MetiendoPuaUY/1.0 +https://metiendopua.com",
    "Accept": "application/json",
  };

  try {
    if (action === "identity") {
      const r = await fetch("https://api.discogs.com/oauth/identity", { headers: dHeaders });
      if (!r.ok) throw new Error(`Discogs auth error: ${r.status}`);
      return res.status(200).json(await r.json());
    }

    if (action === "collection") {
      const idRes = await fetch("https://api.discogs.com/oauth/identity", { headers: dHeaders });
      if (!idRes.ok) throw new Error(`Auth error: ${idRes.status}`);
      const identity = await idRes.json();
      const username = identity.username;

      const url = `https://api.discogs.com/users/${username}/collection/folders/0/releases?page=${page||1}&per_page=${per_page||24}&sort=${sort||"added"}&sort_order=${sort_order||"desc"}`;
      const r = await fetch(url, { headers: dHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      const data = await r.json();
      return res.status(200).json({ ...data, username });
    }

    if (action === "release") {
      if (!id) throw new Error("Missing release id");
      const r = await fetch(`https://api.discogs.com/releases/${id}`, { headers: dHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      return res.status(200).json(await r.json());
    }

    if (action === "search") {
      const r = await fetch(`https://api.discogs.com/database/search?q=${encodeURIComponent(q||"")}&type=release`, { headers: dHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      return res.status(200).json(await r.json());
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    console.error("Discogs handler error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
