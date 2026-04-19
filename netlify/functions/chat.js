exports.handler = async function (event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { messages, wikidataContext, lang } = JSON.parse(event.body);

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
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Error en la API de Anthropic" }),
      };
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "No se pudo obtener respuesta.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  }
};
