// Determines the winner given two scores. Returns "home", "away", "draw", or null if incomplete.
export function winnerOf(homeScore, awayScore) {
  if (homeScore === "" || awayScore === "" || homeScore === null || awayScore === null) {
    return null;
  }
  const h = Number(homeScore);
  const a = Number(awayScore);
  if (Number.isNaN(h) || Number.isNaN(a)) return null;
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
}

// Points logic:
// - Correct winner (home/away) => 1 point
// - Correct winner AND correctly called Extra Time => +1 bonus (2 total)
// - Correct winner AND correctly called Penalties => +2 bonus (3 total)
// - Bonus is only awarded if the base winner prediction was already correct.
export function computePoints(prediction, result) {
  if (!prediction || !result) return 0;
  if (result.homeScore === "" || result.homeScore === undefined || result.homeScore === null) {
    return 0;
  }

  const predictedWinner = winnerOf(prediction.homeScore, prediction.awayScore);
  const actualWinner = winnerOf(result.homeScore, result.awayScore);

  if (!predictedWinner || predictedWinner === "draw") return 0;
  if (!actualWinner || actualWinner === "draw") return 0;
  if (predictedWinner !== actualWinner) return 0;

  let points = 1;
  if (prediction.method === "extra_time" && result.method === "extra_time") points += 1;
  if (prediction.method === "penalties" && result.method === "penalties") points += 2;
  return points;
}
