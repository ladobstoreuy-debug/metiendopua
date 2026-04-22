export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, q, page, id, artist_id, master_id } = req.query;
  const TOKEN = process.env.DISCOGS_TOKEN;
  const headers = {
    "User-Agent": "MetiendoPuaUY/1.0 +https://metiendopua.vercel.app",
    "Accept": "application/vnd.discogs.v2.plaintext+json",
    ...(TOKEN ? { "Authorization": `Discogs token=${TOKEN}` } : {})
  };
  const base = "https://api.discogs.com";

  try {

    // 1. Search artists by name
    if (action === "search_artist") {
      const url = `${base}/database/search?q=${encodeURIComponent(q)}&type=artist&per_page=12&page=${page||1}`;
      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error(`Discogs ${r.status}: ${await r.text()}`);
      return res.status(200).json(await r.json());
    }

    // 2. Artist detail + releases (with pagination support)
    if (action === "artist") {
      const relPage = req.query.page || 1;
      const [aRes, rRes] = await Promise.all([
        fetch(`${base}/artists/${artist_id}`, { headers }),
        fetch(`${base}/artists/${artist_id}/releases?per_page=100&page=${relPage}&sort=year&sort_order=asc`, { headers })
      ]);
      if (!aRes.ok) throw new Error(`Artist ${aRes.status}`);
      const artist = await aRes.json();
      const releases = rRes.ok ? await rRes.json() : { releases: [], pagination: {} };
      return res.status(200).json({ artist, releases });
    }

    // 3. Release detail (for clicking a disc in the discography)
    if (action === "release") {
      const r = await fetch(`${base}/releases/${id}`, { headers });
      if (!r.ok) throw new Error(`Release ${r.status}`);
      return res.status(200).json(await r.json());
    }

    // 4. Master release + versions
    if (action === "master") {
      const [mRes, vRes] = await Promise.all([
        fetch(`${base}/masters/${master_id}`, { headers }),
        fetch(`${base}/masters/${master_id}/versions?per_page=30&page=1`, { headers })
      ]);
      const master = mRes.ok ? await mRes.json() : {};
      const versions = vRes.ok ? await vRes.json() : {};
      return res.status(200).json({ master, versions });
    }

    // 5. Marketplace stats
    if (action === "marketplace") {
      const r = await fetch(`${base}/marketplace/stats/${id}`, { headers });
      if (!r.ok) return res.status(200).json({ num_for_sale: 0 });
      return res.status(200).json(await r.json());
    }

    // 6. Wikipedia summary (REST API — free, no auth)
    if (action === "wikipedia") {
      const lang = req.query.lang === "en" ? "en" : "es";
      const title = encodeURIComponent(q);
      // Try direct summary first
      let wRes = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`,
        { headers: { "User-Agent": "MetiendoPuaUY/1.0" } }
      );
      // If not found in target lang, try English
      if (!wRes.ok && lang !== "en") {
        wRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
          { headers: { "User-Agent": "MetiendoPuaUY/1.0" } }
        );
      }
      if (!wRes.ok) return res.status(200).json({ found: false });
      const data = await wRes.json();
      return res.status(200).json({
        found: true,
        title: data.title,
        extract: data.extract || "",
        thumbnail: data.thumbnail?.source || "",
        url: data.content_urls?.desktop?.page || ""
      });
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    console.error("search.js error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
