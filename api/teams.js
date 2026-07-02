export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Missing FOOTBALL_DATA_TOKEN",
    });
  }

  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({
      error: "teamId is required",
    });
  }

  try {
    const apiRes = await fetch(
      `https://api.football-data.org/v4/teams/${teamId}`,
      {
        headers: {
          "X-Auth-Token": token,
        },
      },
    );

    if (!apiRes.ok) {
      return res.status(apiRes.status).json(await apiRes.json());
    }

    const data = await apiRes.json();

    // Return only what the frontend needs
    res.status(200).json({
      id: data.id,
      name: data.name,
      squad: data.squad ?? [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch team",
    });
  }
}
