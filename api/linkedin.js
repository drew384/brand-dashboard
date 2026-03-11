async function getLinkedInToken() {
  const clientId = process.env.LINKEDIN_CLIENTID;
  const clientSecret = process.env.LINKEDIN_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing LINKEDIN_CLIENTID or LINKEDIN_SECRET env vars");
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`LinkedIn token error: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const personUrn = process.env.LINKEDIN_PERSON_URN;

  try {
    const token = await getLinkedInToken();

    // Try /v2/me first; with client credentials it may not return profile
    const profileRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202304",
        },
      }
    );
    const profileData = profileRes.ok ? await profileRes.json() : null;

    const resolvedUrn =
      personUrn || (profileData?.id ? `urn:li:person:${profileData.id}` : null);

    if (!resolvedUrn) {
      return res.status(500).json({
        error:
          "Missing LINKEDIN_PERSON_URN. Add it to env (e.g. urn:li:person:ABC123) when using client credentials.",
      });
    }

    const encodedUrn = encodeURIComponent(resolvedUrn);

    const [followerRes, statsRes] = await Promise.all([
      fetch(
        `https://api.linkedin.com/v2/networkSizes/${encodedUrn}?edgeType=CompanyFollowedByMember`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "LinkedIn-Version": "202304",
          },
        }
      ),
      (() => {
        const end = Date.now();
        const start = end - 30 * 24 * 60 * 60 * 1000;
        return fetch(
          `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodedUrn}&timeIntervals.timeGranularityType=DAY&timeIntervals.startTime=${start}&timeIntervals.endTime=${end}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "LinkedIn-Version": "202304",
            },
          }
        );
      })(),
    ]);

    const followerData = followerRes.ok ? await followerRes.json() : null;
    const statsData = statsRes.ok ? await statsRes.json() : null;

    const followers = followerData?.firstDegreeSize ?? null;
    const impressions_30d = statsData?.elements
      ? statsData.elements.reduce(
          (sum, e) => sum + (e.totalShareStatistics?.impressionCount ?? 0),
          0
        )
      : null;

    return res.status(200).json({
      followers,
      impressions_30d,
      name: profileData
        ? `${profileData.localizedFirstName || ""} ${profileData.localizedLastName || ""}`.trim()
        : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
