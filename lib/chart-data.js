const fetch = require("node-fetch");

function parseRange(rangeParam) {
  const n = parseInt(rangeParam, 10);
  if ([7, 14, 30].includes(n)) return n;
  return 14;
}

function getDateRangeFromPreset(days) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function parseDateStr(str) {
  if (!str || typeof str !== "string") return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  return isNaN(d.getTime()) ? null : d;
}

function getDateRange(rangeOrStart, endParam) {
  const endParamDate = parseDateStr(endParam);
  const startParamDate = parseDateStr(rangeOrStart);
  if (startParamDate && endParamDate && startParamDate <= endParamDate) {
    const start = new Date(startParamDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endParamDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const days = parseRange(rangeOrStart);
  return getDateRangeFromPreset(days);
}

async function fetchTwitterDaily(token, userId, start, end) {
  const daily = [];
  let total = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const startTime = dayStart.toISOString();
    const endTime = dayEnd.toISOString();

    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics&start_time=${startTime}&end_time=${endTime}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    const impressions = data.data
      ? data.data.reduce((sum, t) => sum + (t.public_metrics?.impression_count ?? 0), 0)
      : 0;

    daily.push({
      date: d.toISOString().slice(0, 10),
      impressions,
    });
    total += impressions;
  }

  return { daily, total };
}

function buildLinkedInDateRange(start, end) {
  const startDay = start.getDate();
  const startMonth = start.getMonth() + 1;
  const startYear = start.getFullYear();
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() + 1);
  const endDay = endDate.getDate();
  const endMonth = endDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  return `(start:(day:${startDay},month:${startMonth},year:${startYear}),end:(day:${endDay},month:${endMonth},year:${endYear}))`;
}

async function fetchLinkedInDaily(accessToken, start, end) {
  if (!accessToken) {
    return { daily: [], total: 0, error: "LINKEDIN_ACCESS_TOKEN required for daily analytics" };
  }

  const dateRange = buildLinkedInDateRange(start, end);
  const url = `https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=DAILY&dateRange=${encodeURIComponent(dateRange)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": "202304",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      daily: [],
      total: 0,
      error: data.message || data.error || "LinkedIn daily analytics failed",
    };
  }

  const dailyMap = {};
  let total = 0;

  if (data.elements && Array.isArray(data.elements)) {
    for (const el of data.elements) {
      const count = el.count ?? 0;
      total += count;
      const range = el.dateRange?.start;
      if (range) {
        const date = `${range.year}-${String(range.month).padStart(2, "0")}-${String(range.day).padStart(2, "0")}`;
        dailyMap[date] = (dailyMap[date] ?? 0) + count;
      }
    }
  }

  const daily = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    daily.push({
      date: dateStr,
      impressions: dailyMap[dateStr] ?? 0,
    });
  }

  return { daily, total };
}

async function getChartData(rangeOrStart, endParam) {
  const { start, end } = getDateRange(rangeOrStart, endParam);

  const token = process.env.TWITTER_BEARER_TOKEN;
  const userId = process.env.TWITTER_USER_ID;
  const linkedInToken = process.env.LINKEDIN_ACCESS_TOKEN;

  const [twitterResult, linkedInResult] = await Promise.all([
    token && userId ? fetchTwitterDaily(token, userId, new Date(start), new Date(end)) : { daily: [], total: 0 },
    fetchLinkedInDaily(linkedInToken, new Date(start), new Date(end)),
  ]);

  return {
    twitter: {
      daily: twitterResult.daily || [],
      total: twitterResult.total ?? 0,
      note: "Impressions from tweets posted each day (lifetime per tweet)",
    },
    linkedin: {
      daily: linkedInResult.daily || [],
      total: linkedInResult.total ?? 0,
      ...(linkedInResult.error && { error: linkedInResult.error }),
    },
  };
}

module.exports = { getChartData };
