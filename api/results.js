// Vercel serverless function: /api/results
//
// This runs on Vercel's server, not in the browser, so it is NOT subject to
// CORS restrictions. The frontend calls THIS endpoint (same-origin, since
// it's served from your own Vercel deployment), and this function does the
// actual call to football-data.org using your secret token.
//
// Setup on Vercel:
// 1. In your Vercel project settings -> Environment Variables, add:
//      FOOTBALL_DATA_TOKEN = your_token_here
//    (no VITE_ prefix here -- this one stays server-side and is never sent
//    to the browser, which is the whole point of doing it this way)
// 2. Redeploy. The frontend will call /api/results instead of hitting
//    football-data.org directly.

export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Server is missing FOOTBALL_DATA_TOKEN. Add it in your Vercel project's environment variables.",
    });
  }

  try {
    const apiRes = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": token },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(apiRes.status).json({
        error: `football-data.org responded with status ${apiRes.status}`,
        details: text,
      });
    }

    const data = await apiRes.json();

    // Cache for 60 seconds at the edge so repeated clicks don't burn through
    // the free tier's 10 requests/minute limit.
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach football-data.org", details: err.message });
  }
}
