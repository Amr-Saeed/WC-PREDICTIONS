// Client-side mirror of the public.points_for_prediction SQL function.
// Used only to show an explanatory breakdown on match cards — the
// leaderboard itself is always calculated server-side via get_leaderboard().
//
// Keep these four constants in sync with the SQL function's constants.
// export const WINNER_POINTS = 3;
// export const EXACT_SCORE_BONUS = 2;
// export const DRAW_BONUS = 2;
// export const EXTRA_TIME_EXACT_BONUS = 1;

const WINNER_POINTS = 3;
const EXACT_SCORE_BONUS = 2;

const EXTRA_TIME_METHOD_BONUS = 1;
const EXTRA_TIME_EXACT_BONUS = 1;

const PENALTY_WINNER_BONUS = 2;
const PENALTY_SCORE_BONUS = 2;
const PENALTY_METHOD_ONLY_BONUS = 1;
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
  if (result.homeScore === null || result.homeScore === undefined) {
    return { total: 0, breakdown };
  }

  const actualDraw90 = result.homeScore === result.awayScore;
  const predictedDraw90 = prediction.homeScore === prediction.awayScore;

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

  // Wrong winner
  if (!predictedWinner || !actualWinner || predictedWinner !== actualWinner) {
    // Special case:
    // Match went to penalties, user predicted penalties,
    // but picked the wrong winner -> +1 point.
    if (
      predictedDraw90 &&
      actualDraw90 &&
      prediction.method === "penalties" &&
      result.method === "penalties"
    ) {
      return {
        total: PENALTY_METHOD_ONLY_BONUS,
        breakdown: [
          {
            label: "Predicted penalties",
            points: PENALTY_METHOD_ONLY_BONUS,
            description:
              "You correctly predicted the match would be decided on penalties, but selected the wrong winner.",
          },
        ],
      };
    }

    return {
      total: 0,
      breakdown: [
        {
          label: "Incorrect winner",
          points: 0,
          description: "Your predicted winner was incorrect.",
        },
      ],
    };
  }

  // Correct winner
  let total = WINNER_POINTS;

  breakdown.push({
    label: "Correct winner",
    points: WINNER_POINTS,
    description: "You predicted the correct winner.",
  });

  // Regular time match
  if (!actualDraw90) {
    if (
      prediction.homeScore === result.homeScore &&
      prediction.awayScore === result.awayScore
    ) {
      total += EXACT_SCORE_BONUS;

      breakdown.push({
        label: "Exact score",
        points: EXACT_SCORE_BONUS,
        description: "You predicted the exact final score.",
      });
    }

    return { total, breakdown };
  }

  // Extra time bonuses
  if (result.method === "extra_time" && prediction.method === "extra_time") {
    total += 1;

    breakdown.push({
      label: "Predicted extra time",
      points: 1,
      description:
        "You correctly predicted the match would be decided in extra time.",
    });

    if (
      prediction.extraHome != null &&
      prediction.extraAway != null &&
      prediction.extraHome === result.extraHome &&
      prediction.extraAway === result.extraAway
    ) {
      total += EXTRA_TIME_EXACT_BONUS;

      breakdown.push({
        label: "Exact extra-time score",
        points: EXTRA_TIME_EXACT_BONUS,
        description: "You predicted the exact extra-time score.",
      });
    }
  }

  // Penalties bonuses
  if (result.method === "penalties" && prediction.method === "penalties") {
    total += PENALTY_WINNER_BONUS;

    breakdown.push({
      label: "Predicted penalties",
      points: PENALTY_WINNER_BONUS,
      description:
        "You correctly predicted the match would be decided on penalties.",
    });

    if (
      prediction.penHome != null &&
      prediction.penAway != null &&
      result.penHome != null &&
      result.penAway != null &&
      prediction.penHome === result.penHome &&
      prediction.penAway === result.penAway
    ) {
      total += PENALTY_SCORE_BONUS;

      breakdown.push({
        label: "Exact penalty shootout",
        points: PENALTY_SCORE_BONUS,
        description: "You predicted the exact penalty shootout score.",
      });
    }
  }

  return { total, breakdown };
}

// Kept for backwards compatibility, in case anything else still imports it.
export function computePoints(prediction, result) {
  return computePointsBreakdown(prediction, result).total;
}
