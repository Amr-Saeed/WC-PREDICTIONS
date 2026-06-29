// Client-side mirror of the public.points_for_prediction SQL function.
// Used only to show an explanatory breakdown on match cards — the
// leaderboard itself is always calculated server-side via get_leaderboard().
//
// Keep these four constants in sync with the SQL function's constants.
export const WINNER_POINTS = 3;
export const EXACT_SCORE_BONUS = 2;
export const DRAW_BONUS = 2;
export const EXTRA_TIME_EXACT_BONUS = 1;

function winnerSide(home, away, method, extraHome, extraAway, penWinner) {
  if (
    home === null ||
    away === null ||
    home === undefined ||
    away === undefined
  )
    return null;
  if (home !== away) return home > away ? "home" : "away";

  if (
    method === "extra_time" &&
    extraHome != null &&
    extraAway != null &&
    extraHome !== extraAway
  ) {
    return extraHome > extraAway ? "home" : "away";
  }
  if (method === "penalties" && penWinner) {
    return penWinner;
  }
  return null;
}

// Returns { total, breakdown: [{ label, points }] } explaining the score.
export function computePointsBreakdown(prediction, result) {
  const breakdown = [];

  if (!prediction || !result) return { total: 0, breakdown };
  if (result.homeScore === null || result.homeScore === undefined)
    return { total: 0, breakdown };

  const predictedWinner = winnerSide(
    prediction.homeScore,
    prediction.awayScore,
    prediction.method,
    prediction.extraHome,
    prediction.extraAway,
    prediction.penWinner,
  );
  const actualWinner = winnerSide(
    result.homeScore,
    result.awayScore,
    result.method,
    result.extraHome,
    result.extraAway,
    result.penWinner,
  );

  if (!predictedWinner || !actualWinner || predictedWinner !== actualWinner) {
    return { total: 0, breakdown: [{ label: "Incorrect winner", points: 0 }] };
  }

  let total = WINNER_POINTS;
  breakdown.push({ label: "Correct winner", points: WINNER_POINTS });

  const actualDraw90 = result.homeScore === result.awayScore;
  const predictedDraw90 = prediction.homeScore === prediction.awayScore;

  if (!actualDraw90) {
    if (
      prediction.homeScore === result.homeScore &&
      prediction.awayScore === result.awayScore
    ) {
      total += EXACT_SCORE_BONUS;
      breakdown.push({ label: "Exact final score", points: EXACT_SCORE_BONUS });
    }
  } else {
    if (predictedDraw90) {
      total += DRAW_BONUS;
      breakdown.push({
        label: "Correctly predicted a draw after 90 minutes",
        points: DRAW_BONUS,
      });
    }
    if (
      result.method === "extra_time" &&
      prediction.method === "extra_time" &&
      prediction.extraHome != null &&
      prediction.extraAway != null &&
      prediction.extraHome === result.extraHome &&
      prediction.extraAway === result.extraAway
    ) {
      total += EXTRA_TIME_EXACT_BONUS;
      breakdown.push({
        label: "Exact extra-time score",
        points: EXTRA_TIME_EXACT_BONUS,
      });
    }
  }

  return { total, breakdown };
}

// Kept for backwards compatibility, in case anything else still imports it.
export function computePoints(prediction, result) {
  return computePointsBreakdown(prediction, result).total;
}
