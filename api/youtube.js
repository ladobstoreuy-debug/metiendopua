export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const YT_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_KEY) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY not configured in Vercel environment variables." });
  }

  const CHANNEL_ID = "UCV5Tbnk8BtMrgH-eIwtAOew";

  try {
    // Step 1: get the uploads playlist ID for this channel (costs 1 unit)
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YT_KEY}`
    );
    const chData = await chRes.json();

    if (chData.error) throw new Error(chData.error.message);

    const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error("No uploads playlist found");

    // Step 2: get the latest videos from the uploads playlist (costs 1 unit)
    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=6&key=${YT_KEY}`
    );
    const plData = await plRes.json();

    if (plData.error) throw new Error(plData.error.message);

    // Step 3: get view counts for each video (costs 1 unit)
    const videoIds = (plData.items || [])
      .map(i => i.snippet?.resourceId?.videoId)
      .filter(Boolean)
      .join(",");

    let statsMap = {};
    if (videoIds) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YT_KEY}`
      );
      const statsData = await statsRes.json();
      (statsData.items || []).forEach(v => {
        statsMap[v.id] = v.statistics;
      });
    }

    const videos = (plData.items || []).map(item => {
      const s = item.snippet || {};
      const vid = s.resourceId?.videoId || "";
      return {
        id: vid,
        title: s.title || "",
        description: s.description || "",
        publishedAt: s.publishedAt || "",
        thumbnail:
          s.thumbnails?.maxres?.url ||
          s.thumbnails?.high?.url ||
          s.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        views: statsMap[vid]?.viewCount || "0",
        likes: statsMap[vid]?.likeCount || "0",
      };
    });

    // Cache for 1 hour
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ videos });

  } catch (err) {
    console.error("YouTube API error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
