export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables." });
  }

  try {
    const { messages, wikidataContext, lang } = req.body;

    const systemPrompt = `Eres el asistente musical del canal de YouTube "Metiendo Púa" (@MetiendoPuaUY), especializado en Rock y Pop de los 70s, 80s y 90s en vinilo y CD.

Tu rol: responder consultas sobre artistas, álbumes, ediciones de vinilos, sellos discográficos, años de lanzamiento, caras B, versiones especiales y curiosidades musicales de esa era.

Idioma: responde siempre en el mismo idioma que la pregunta del usuario (español o inglés).

Tono: apasionado, cercano, como un coleccionista experto compartiendo conocimiento. Usa emojis ocasionalmente.

Si se te proveen datos de Wikidata, úsalos como base pero amplía con tu conocimiento. Si los datos de Wikidata están vacíos, usa tu propio conocimiento enciclopédico sobre música.

Formato: respuestas concisas pero completas. Usa **negritas** para destacar nombres de álbumes y artistas. Máximo 3-4 párrafos.${wikidataContext ? "\n\nDatos encontrados en Wikidata:\n" + wikidataContext : ""}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: "Error en la API de Anthropic" });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "No se pudo obtener respuesta.";
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
