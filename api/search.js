export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, q, type, page, id, master_id, artist_id } = req.query;
  // Discogs public API — no auth needed for search/database
  // Use token if available for higher rate limits
  const TOKEN = process.env.DISCOGS_TOKEN;
  const headers = {
    "User-Agent": "MetiendoPuaUY/1.0 +https://metiendopua.vercel.app",
    "Accept": "application/json",
    ...(TOKEN ? { "Authorization": `Discogs token=${TOKEN}` } : {})
  };

  const base = "https://api.discogs.com";

  try {
    // Search releases or artists
    if (action === "search") {
      const t = type || "all"; // release, artist, or all
      let url;
      if (t === "all") {
        url = `${base}/database/search?q=${encodeURIComponent(q)}&per_page=24&page=${page||1}`;
      } else {
        url = `${base}/database/search?q=${encodeURIComponent(q)}&type=${t}&per_page=24&page=${page||1}`;
      }
      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error(`Discogs ${r.status}`);
      return res.status(200).json(await r.json());
    }

    // Release detail
    if (action === "release") {
      const r = await fetch(`${base}/releases/${id}`, { headers });
      if (!r.ok) throw new Error(`Discogs ${r.status}`);
      return res.status(200).json(await r.json());
    }

    // Master release (all versions/editions)
    if (action === "master") {
      const [mRes, vRes] = await Promise.all([
        fetch(`${base}/masters/${master_id}`, { headers }),
        fetch(`${base}/masters/${master_id}/versions?per_page=50&page=1`, { headers })
      ]);
      const master = mRes.ok ? await mRes.json() : {};
      const versions = vRes.ok ? await vRes.json() : {};
      return res.status(200).json({ master, versions });
    }

    // Marketplace stats for a release
    if (action === "marketplace") {
      const r = await fetch(`${base}/marketplace/stats/${id}`, { headers });
      if (!r.ok) throw new Error(`Discogs ${r.status}`);
      return res.status(200).json(await r.json());
    }

    // Artist detail
    if (action === "artist") {
      const [aRes, rRes] = await Promise.all([
        fetch(`${base}/artists/${artist_id}`, { headers }),
        fetch(`${base}/artists/${artist_id}/releases?per_page=100&page=1&sort=year&sort_order=asc`, { headers })
      ]);
      const artist = aRes.ok ? await aRes.json() : {};
      const releases = rRes.ok ? await rRes.json() : {};
      return res.status(200).json({ artist, releases });
    }

    // Wikidata artist lookup by name
    if (action === "wikidata") {
      const name = encodeURIComponent(q);
      const lang = req.query.lang || "es";
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${name}&language=${lang}&uselang=${lang}&type=item&limit=3&format=json&origin=*`;
      const sRes = await fetch(searchUrl, { headers: { "User-Agent": "MetiendoPuaUY/1.0" } });
      if (!sRes.ok) throw new Error("Wikidata search failed");
      const sData = await sRes.json();
      const items = sData.search || [];
      if (!items.length) return res.status(200).json({ found: false });

      // Get details for top result
      const entityId = items[0].id;
      const detailUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&languages=${lang}|en&props=labels|descriptions|claims|sitelinks&format=json&origin=*`;
      const dRes = await fetch(detailUrl, { headers: { "User-Agent": "MetiendoPuaUY/1.0" } });
      const dData = dRes.ok ? await dRes.json() : {};
      const entity = dData.entities?.[entityId] || {};
      const claims = entity.claims || {};

      // Extract key facts
      const inception = claims.P571?.[0]?.mainsnak?.datavalue?.value?.time?.substring(1,5);
      const dissolved = claims.P576?.[0]?.mainsnak?.datavalue?.value?.time?.substring(1,5);
      const country = claims.P495?.[0]?.mainsnak?.datavalue?.value?.id;
      const genres = (claims.P136 || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0,5);
      const members = (claims.P527 || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0,8);
      const wikipedia = entity.sitelinks?.enwiki?.title || entity.sitelinks?.eswiki?.title;

      return res.status(200).json({
        found: true,
        entityId,
        label: entity.labels?.[lang]?.value || entity.labels?.en?.value || items[0].label,
        description: entity.descriptions?.[lang]?.value || entity.descriptions?.en?.value || "",
        inception,
        dissolved,
        country,
        genres,
        members,
        wikipedia,
        wikidataUrl: `https://www.wikidata.org/wiki/${entityId}`
      });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Search API error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
