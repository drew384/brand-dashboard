require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// ─── Twitter API ───────────────────────────────────────────────────────────────
app.get('/api/twitter', async (req, res) => {
  const token = process.env.TWITTER_BEARER_TOKEN;
  const userId = process.env.TWITTER_USER_ID;

  if (!token || !userId) {
    return res.status(500).json({ error: 'Missing TWITTER_BEARER_TOKEN or TWITTER_USER_ID in .env' });
  }

  try {
    // Follower count
    const userRes = await fetch(
      `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const userData = await userRes.json();

    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: userData });
    }

    const metrics = userData.data?.public_metrics || {};

    // Recent tweet impressions (last 7 days)
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics&start_time=${startTime}&end_time=${endTime}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();

    const impressions = tweetsData.data
      ? tweetsData.data.reduce((sum, t) => sum + (t.public_metrics?.impression_count || 0), 0)
      : 0;

    return res.json({
      followers: metrics.followers_count || 0,
      following: metrics.following_count || 0,
      tweets: metrics.tweet_count || 0,
      impressions_7d: impressions,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── LinkedIn: get access token via Client Credentials ────────────────────────
async function getLinkedInToken() {
  const clientId = process.env.LINKEDIN_CLIENTID;
  const clientSecret = process.env.LINKEDIN_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing LINKEDIN_CLIENTID or LINKEDIN_SECRET env vars');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`LinkedIn token error: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

// ─── LinkedIn API ──────────────────────────────────────────────────────────────
app.get('/api/linkedin', async (req, res) => {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrnEnv = process.env.LINKEDIN_PERSON_URN;

  let token;
  let personUrn;

  try {
    if (accessToken && personUrnEnv) {
      token = accessToken;
      personUrn = personUrnEnv;
    } else if (process.env.LINKEDIN_CLIENTID && process.env.LINKEDIN_SECRET) {
      try {
        token = await getLinkedInToken();
        personUrn = personUrnEnv;
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('not allowed to create application tokens') || msg.includes('access_denied')) {
          return res.status(500).json({
            error: 'LinkedIn client credentials are restricted. Use 3-legged OAuth: set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN. See README.',
          });
        }
        throw err;
      }
    } else {
      return res.status(500).json({
        error: 'LinkedIn auth required. Use 3-legged OAuth: set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN. See README.',
      });
    }

    if (!personUrn) {
      return res.status(500).json({ error: 'Missing LINKEDIN_PERSON_URN. Add it to .env (e.g. urn:li:person:ABC123).' });
    }

    // Fetch profile for name (works with 3-legged token)
    const profileRes = await fetch(
      'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture)',
      { headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202304' } }
    );
    const profileData = profileRes.ok ? await profileRes.json() : null;
    let followers = null;

    if (personUrn) {
      const encodedUrn = encodeURIComponent(personUrn);
      const followerRes = await fetch(
        `https://api.linkedin.com/v2/networkSizes/${encodedUrn}?edgeType=CompanyFollowedByMember`,
        { headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202304' } }
      );
      const followerData = followerRes.ok ? await followerRes.json() : null;
      followers = followerData?.firstDegreeSize || null;
    }

    // Post impressions (last 30 days)
    let impressions = null;
    if (personUrn) {
      const encodedUrn = encodeURIComponent(personUrn);
      const end = Date.now();
      const start = end - 30 * 24 * 60 * 60 * 1000;
      const statsRes = await fetch(
        `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodedUrn}&timeIntervals.timeGranularityType=DAY&timeIntervals.startTime=${start}&timeIntervals.endTime=${end}`,
        { headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202304' } }
      );
      const statsData = statsRes.ok ? await statsRes.json() : null;
      impressions = statsData?.elements
        ? statsData.elements.reduce((sum, e) => sum + (e.totalShareStatistics?.impressionCount || 0), 0)
        : null;
    }

    return res.json({
      followers,
      impressions_30d: impressions,
      name: profileData ? `${profileData.localizedFirstName || ''} ${profileData.localizedLastName || ''}`.trim() : null,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Chart API (daily data) ─────────────────────────────────────────────────────
const { getChartData } = require('./lib/chart-data.js');
app.get('/api/chart', async (req, res) => {
  try {
    const start = req.query?.start;
    const end = req.query?.end;
    const result =
      start && end
        ? await getChartData(start, end)
        : await getChartData(req.query?.range || '14');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Brand dashboard running at http://localhost:${PORT}`);
});
