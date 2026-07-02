import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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

          const matches = Array.isArray(data.matches) ? data.matches : [];
          console.log(
            "[football-data][dev] fetched matches:",
            matches.map((match) => ({
              id: match.id,
              status: match.status,
              kickoffUtc: match.utcDate,
              home: match.homeTeam?.name,
              away: match.awayTeam?.name,
            })),
          );

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

function saveResultsApiPlugin(supabaseUrl, serviceRoleKey) {
  return {
    name: "dev-save-results-api",
    configureServer(server) {
      server.middlewares.use("/api/save-results", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        if (!supabaseUrl || !serviceRoleKey) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                "Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY for local dev.",
            }),
          );
          return;
        }

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        let payload = {};
        try {
          payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        } catch {
          payload = {};
        }

        const results = payload.results || {};
        const rows = Object.entries(results).map(([matchId, result]) => ({
          match_id: matchId,
          home_score: result.homeScore,
          away_score: result.awayScore,
          method: result.method || "regular",
          extra_home: result.extraHome ?? null,
          extra_away: result.extraAway ?? null,
          pen_winner: result.penWinner ?? null,
          pen_home: result.penHome ?? null,
          pen_away: result.penAway ?? null,
        }));

        if (rows.length === 0) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ results: {}, count: 0 }));
          return;
        }

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const client = createClient(supabaseUrl, serviceRoleKey);
          const { data, error } = await client
            .from("results")
            .upsert(rows, { onConflict: "match_id" })
            .select(
              "match_id, home_score, away_score, method, extra_home, extra_away, pen_winner, pen_home, pen_away",
            );

          if (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error.message }));
            return;
          }
          const savedResults = (data || []).reduce((acc, row) => {
            acc[row.match_id] = {
              homeScore: row.home_score,
              awayScore: row.away_score,
              method: row.method,
              extraHome: row.extra_home,
              extraAway: row.extra_away,
              penWinner: row.pen_winner,
              penHome: row.pen_home,
              penAway: row.pen_away,
            };
            return acc;
          }, {});

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ results: savedResults, count: rows.length }),
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    },
  };
}
function teamsApiPlugin(token) {
  return {
    name: "dev-teams-api",
    configureServer(server) {
      server.middlewares.use("/api/teams", async (req, res, next) => {
        if (req.method && req.method !== "GET") {
          next();
          return;
        }

        if (!token) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing FOOTBALL_DATA_TOKEN" }));
          return;
        }

        const url = new URL(req.url, "http://localhost");
        const teamId = url.searchParams.get("teamId");

        if (!teamId) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "teamId is required" }));
          return;
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

          const data = await apiRes.json();

          res.statusCode = apiRes.status;
          res.setHeader("Content-Type", "application/json");

          res.end(
            JSON.stringify({
              id: data.id,
              name: data.name,
              squad: data.squad ?? [],
            }),
          );
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallbackDenylist: [/OneSignalSDKWorker\.js/],
        },
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],

        manifest: {
          name: "Tawaqo3",
          short_name: "Tawaqo3",
          description: "Football Prediction App",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",

          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },

        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
      }),
      resultsApiPlugin(env.FOOTBALL_DATA_TOKEN),
      teamsApiPlugin(env.FOOTBALL_DATA_TOKEN), // <-- add this

      saveResultsApiPlugin(
        env.SUPABASE_URL || env.VITE_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
      ),
    ],
  };
});
