// api/twitter.js
// Proxies requests to Twitter/X API v2
// Required env vars: TWITTER_BEARER_TOKEN, TWITTER_USER_ID

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.TWITTER_BEARER_TOKEN;
  const userId = process.env.TWITTER_USER_ID;

  if (!token || !userId) {
    return res.status(500).json({ error: "Missing TWITTER_BEARER_TOKEN or TWITTER_USER_ID env vars" });
  }

  try {
    // Fetch user metrics (followers)
    const userRes = await fetch(
      `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const userData = await userRes.json();

    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: userData });
    }

    const followers = userData.data?.public_metrics?.followers_count ?? null;

    // Fetch tweet impressions for last 7 days
    // Requires Basic tier ($100/mo) or higher
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics&start_time=${startTime}&end_time=${endTime}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();

    const totalImpressions = tweetsData.data
      ? tweetsData.data.reduce((sum, t) => sum + (t.public_metrics?.impression_count ?? 0), 0)
      : null;

    return res.status(200).json({
      platform: "twitter",
      followers,
      impressions_7d: totalImpressions,
      tweet_count: tweetsData.data?.length ?? 0,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
