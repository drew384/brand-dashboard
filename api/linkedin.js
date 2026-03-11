export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;

  if (!token || !personUrn) {
    return res.status(500).json({ error: "Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN env vars" });
  }

  const encodedUrn = encodeURIComponent(personUrn);

  try {
    const followerRes = await fetch(
      `https://api.linkedin.com/v2/networkSizes/${encodedUrn}?edgeType=CompanyFollowedByMember`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202304",
        },
      }
    );

    const end = Date.now();
    const start = end - 30 * 24 * 60 * 60 * 1000;

    const statsRes = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodedUrn}&timeIntervals.timeGranularityType=DAY&timeIntervals.startTime=${start}&timeIntervals.endTime=${end}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202304",
        },
      }
    );

    const followerData = followerRes.ok ? await followerRes.json() : null;
    const statsData = statsRes.ok ? await statsRes.json() : null;

    const totalImpressions = statsData?.elements
      ? statsData.elements.reduce((sum, e) => sum + (e.totalShareStatistics?.impressionCount ?? 0), 0)
      : null;

    return res.status(200).json({
      platform: "linkedin",
      followers: followerData?.firstDegreeSize ?? null,
      impressions_30d: totalImpressions,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
