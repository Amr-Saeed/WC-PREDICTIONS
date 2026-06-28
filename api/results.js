export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!token) {
    return res.status(500).json({
      error:
        "Server is missing FOOTBALL_DATA_TOKEN. Add it in your Vercel project's environment variables.",
    });
  }

  try {
    const apiRes = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: { "X-Auth-Token": token },
      },
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(apiRes.status).json({
        error: `football-data.org responded with status ${apiRes.status}`,
        details: text,
      });
    }

    const data = await apiRes.json();

    const matches = Array.isArray(data.matches) ? data.matches : [];
    console.log(
      "[football-data] fetched matches:",
      matches.map((match) => ({
        id: match.id,
        status: match.status,
        kickoffUtc: match.utcDate,
        home: match.homeTeam?.name,
        away: match.awayTeam?.name,
      })),
    );

    // Cache for 60 seconds at the edge so repeated clicks don't burn through
    // the free tier's 10 requests/minute limit.
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to reach football-data.org",
      details: err.message,
    });
  }
}
