exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
  if (!DISCOGS_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "DISCOGS_TOKEN not configured in Netlify environment variables." }),
    };
  }

  // Parse path: /api/discogs?action=collection&page=1
  //                          action=release&id=123
  //                          action=search&q=Beatles
  const params = event.queryStringParameters || {};
  const action = params.action || "collection";

  const discogsHeaders = {
    "Authorization": `Discogs token=${DISCOGS_TOKEN}`,
    "User-Agent": "MetiendoPuaUY/1.0 +https://metiendopua.com",
    "Accept": "application/json",
  };

  let url = "";

  try {
    if (action === "identity") {
      // Get the authenticated user's identity
      url = "https://api.discogs.com/oauth/identity";
      const r = await fetch(url, { headers: discogsHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      const data = await r.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === "collection") {
      // First get username via identity
      const idRes = await fetch("https://api.discogs.com/oauth/identity", { headers: discogsHeaders });
      if (!idRes.ok) throw new Error(`Auth error: ${idRes.status}`);
      const identity = await idRes.json();
      const username = identity.username;

      const page = params.page || 1;
      const perPage = params.per_page || 24;
      const sort = params.sort || "added";
      const sortOrder = params.sort_order || "desc";

      url = `https://api.discogs.com/users/${username}/collection/folders/0/releases?page=${page}&per_page=${perPage}&sort=${sort}&sort_order=${sortOrder}`;
      const r = await fetch(url, { headers: discogsHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      const data = await r.json();
      return { statusCode: 200, headers, body: JSON.stringify({ ...data, username }) };
    }

    if (action === "release") {
      const id = params.id;
      if (!id) throw new Error("Missing release id");
      url = `https://api.discogs.com/releases/${id}`;
      const r = await fetch(url, { headers: discogsHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      const data = await r.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === "search") {
      const q = params.q || "";
      url = `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&type=release&token=${DISCOGS_TOKEN}`;
      const r = await fetch(url, { headers: discogsHeaders });
      if (!r.ok) throw new Error(`Discogs error: ${r.status}`);
      const data = await r.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    console.error("Discogs function error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
