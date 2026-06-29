export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userIds, title, message, url } = req.body;

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,

        include_aliases: {
          external_id: userIds,
        },

        target_channel: "push",

        headings: {
          en: title,
        },

        contents: {
          en: message,
        },

        url,
      }),
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
}
