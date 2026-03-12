const { getChartData } = require("../lib/chart-data.js");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const start = req.query?.start;
    const end = req.query?.end;
    const result =
      start && end
        ? await getChartData(start, end)
        : await getChartData(req.query?.range || "14");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
