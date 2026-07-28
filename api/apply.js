module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  var webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({
      ok: false,
      error: "WEBHOOK_URL is not configured on Vercel"
    });
  }

  try {
    var payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    var upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    var text = await upstream.text();
    var data;
    try {
      data = text ? JSON.parse(text) : { ok: upstream.ok };
    } catch (e) {
      data = { ok: upstream.ok, raw: text };
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: "Webhook responded with " + upstream.status,
        details: data
      });
    }

    return res.status(200).json(data && typeof data === "object" ? data : { ok: true });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: err && err.message ? err.message : "Failed to reach webhook"
    });
  }
};
