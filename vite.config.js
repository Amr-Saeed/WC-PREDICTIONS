import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function resultsApiPlugin(token) {
  return {
    name: "dev-results-api",
    configureServer(server) {
      server.middlewares.use("/api/results", async (req, res, next) => {
        if (req.method && req.method !== "GET") {
          next();
          return;
        }

        if (!token) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                "Server is missing FOOTBALL_DATA_TOKEN. Add it to your .env file for local dev or to Vercel for production.",
            }),
          );
          return;
        }

        try {
          const apiRes = await fetch(
            "https://api.football-data.org/v4/competitions/WC/matches",
            {
              headers: { "X-Auth-Token": token },
            },
          );

          res.setHeader(
            "Cache-Control",
            "s-maxage=60, stale-while-revalidate=30",
          );
          res.setHeader("Content-Type", "application/json");

          if (!apiRes.ok) {
            const text = await apiRes.text();
            res.statusCode = apiRes.status;
            res.end(
              JSON.stringify({
                error: `football-data.org responded with status ${apiRes.status}`,
                details: text,
              }),
            );
            return;
          }

          const data = await apiRes.json();
          res.statusCode = 200;
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Failed to reach football-data.org",
              details: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), resultsApiPlugin(env.FOOTBALL_DATA_TOKEN)],
  };
});
