export async function fetchTeam(teamId) {
  const res = await fetch(`/api/teams?teamId=${teamId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch team");
  }

  return res.json();
}
