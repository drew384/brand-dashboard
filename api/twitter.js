export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.TWITTER_BEARER_TOKEN;
  const userId = process.env.TWITTER_USER_ID;

  if (!token || !userId) {
    return res.status(500).json({ error: "Missing TWITTER_BEARER_TOKEN or TWITTER_USER_ID env vars" });
  }

  try {
    const userRes = await fetch(
      `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const userData = await userRes.json();

    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: userData });
    }

    const metrics = userData.data?.public_metrics || {};

    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics&start_time=${startTime}&end_time=${endTime}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();

    const impressions = tweetsData.data
      ? tweetsData.data.reduce((sum, t) => sum + (t.public_metrics?.impression_count ?? 0), 0)
      : 0;

    return res.status(200).json({
      followers: metrics.followers_count ?? 0,
      following: metrics.following_count ?? 0,
      tweets: metrics.tweet_count ?? 0,
      impressions_7d: impressions,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
