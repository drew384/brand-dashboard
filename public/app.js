(function () {
  const RANGE_STORAGE_KEY = "brand-dashboard-date-range";

  const formatNum = (n) => {
    if (n === null || n === undefined) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  };

  function showTwitterLoading() {
    document.querySelector("[data-twitter-loading]").classList.remove("hidden");
    document.querySelector("[data-twitter-error]").classList.add("hidden");
    document.querySelector("[data-twitter-metrics]").classList.add("hidden");
  }

  function showTwitterError(msg) {
    document.querySelector("[data-twitter-loading]").classList.add("hidden");
    document.querySelector("[data-twitter-metrics]").classList.add("hidden");
    const el = document.querySelector("[data-twitter-error]");
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function showTwitterData(data) {
    document.querySelector("[data-twitter-loading]").classList.add("hidden");
    document.querySelector("[data-twitter-error]").classList.add("hidden");
    document.querySelector("[data-twitter-followers]").textContent = formatNum(data.followers);
    document.querySelector("[data-twitter-following]").textContent = formatNum(data.following);
    document.querySelector("[data-twitter-tweets]").textContent = formatNum(data.tweets);
    document.querySelector("[data-twitter-impressions]").textContent = formatNum(data.impressions_7d);
    document.querySelector("[data-twitter-metrics]").classList.remove("hidden");
  }

  function showLinkedInLoading() {
    document.querySelector("[data-linkedin-loading]").classList.remove("hidden");
    document.querySelector("[data-linkedin-error]").classList.add("hidden");
    document.querySelector("[data-linkedin-metrics]").classList.add("hidden");
  }

  function showLinkedInError(msg) {
    document.querySelector("[data-linkedin-loading]").classList.add("hidden");
    document.querySelector("[data-linkedin-metrics]").classList.add("hidden");
    const el = document.querySelector("[data-linkedin-error]");
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function showLinkedInData(data) {
    document.querySelector("[data-linkedin-loading]").classList.add("hidden");
    document.querySelector("[data-linkedin-error]").classList.add("hidden");
    document.querySelector("[data-linkedin-followers]").textContent = formatNum(data.followers);
    document.querySelector("[data-linkedin-impressions]").textContent = formatNum(data.impressions_30d);
    document.querySelector("[data-linkedin-metrics]").classList.remove("hidden");
  }

  function parseError(data) {
    if (typeof data === "string") return data;
    if (data?.error?.title === "CreditsDepleted") return "Twitter API credits depleted. Add credits in X Developer Console or wait for monthly reset.";
    if (data?.error?.detail) return data.error.detail;
    if (data?.error?.message) return data.error.message;
    if (data?.error?.error_description) return data.error.error_description;
    if (data?.error?.errors?.[0]?.message) return data.error.errors[0].message;
    if (data?.error) return typeof data.error === "string" ? data.error : (data.error?.errors?.[0]?.message || "Request failed");
    if (data?.errors?.[0]?.message) return data.errors[0].message;
    return null;
  }

  async function fetchTwitter() {
    showTwitterLoading();
    try {
      const res = await fetch("/api/twitter");
      const data = await res.json();
      if (!res.ok) {
        showTwitterError(parseError(data) || "Failed to load Twitter data");
        return;
      }
      if (data.followers !== undefined || data.following !== undefined || data.tweets !== undefined) {
        showTwitterData(data);
      } else {
        showTwitterError(parseError(data) || "Invalid Twitter response");
      }
    } catch (err) {
      showTwitterError(err.message || "Network error");
    }
  }

  async function fetchLinkedIn() {
    showLinkedInLoading();
    try {
      const res = await fetch("/api/linkedin");
      const data = await res.json();
      if (!res.ok) {
        const msg = parseError(data) || "Failed to load LinkedIn data";
        showLinkedInError(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
        return;
      }
      showLinkedInData(data);
    } catch (err) {
      showLinkedInError(err.message || "Network error");
    }
  }

  function getChartColors() {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    return {
      twitter: "#1d9bf0",
      linkedin: "#f59e0b",
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      text: isDark ? "#8b8b96" : "#6b6b76",
    };
  }

  let chartInstance = null;
  let chartFetchController = null;

  function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function renderChart(apiData) {
    const canvas = document.getElementById("impressionsChart");
    if (!canvas) return;

    const totalEl = document.querySelector("[data-chart-total]");
    if (totalEl) {
      const twTotal = apiData?.twitter?.total ?? 0;
      const liTotal = apiData?.linkedin?.total ?? 0;
      const total = twTotal + liTotal;
      totalEl.textContent = total > 0 ? `${formatNum(total)} total impressions` : "—";
    }

    const tw = apiData?.twitter?.daily || [];
    const li = apiData?.linkedin?.daily || [];
    const labels = tw.length > 0 ? tw.map((p) => {
      const d = new Date(p.date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }) : li.map((p) => {
      const d = new Date(p.date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    const twitterData = tw.length > 0 ? tw.map((p) => p.impressions) : labels.map(() => null);
    const linkedinData = li.length > 0 ? li.map((p) => p.impressions) : labels.map(() => null);

    const colors = getChartColors();

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Twitter",
            data: twitterData,
            borderColor: colors.twitter,
            backgroundColor: colors.twitter + "80",
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: "LinkedIn",
            data: linkedinData,
            borderColor: colors.linkedin,
            backgroundColor: colors.linkedin + "80",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            position: "top",
            labels: { color: colors.text, usePointStyle: true },
          },
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, maxRotation: 0 },
          },
          y: {
            grid: { color: colors.grid },
            ticks: { color: colors.text },
            beginAtZero: true,
          },
        },
      },
    });
  }

  async function fetchChartData(startDate, endDate) {
    if (chartFetchController) chartFetchController.abort();
    chartFetchController = new AbortController();
    const { signal } = chartFetchController;

    try {
      const params = endDate
        ? `start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
        : `range=${startDate}`;
      const res = await fetch(`/api/chart?${params}`, { signal });
      const data = await res.json();
      if (signal.aborted) return;
      if (!res.ok) {
        renderChart({ twitter: { daily: [] }, linkedin: { daily: [] } });
        return;
      }
      renderChart(data);
    } catch (err) {
      if (err.name === "AbortError") return;
      renderChart({ twitter: { daily: [] }, linkedin: { daily: [] } });
    }
  }

  let flatpickrInstance = null;

  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const body = document.body;
    const next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    localStorage.setItem("brand-dashboard-theme", next);
    if (flatpickrInstance) {
      flatpickrInstance.config.theme = next === "dark" ? "dark" : "light";
    }
    const saved = localStorage.getItem(RANGE_STORAGE_KEY);
    if (saved) {
      try {
        const { start, end } = JSON.parse(saved);
        if (start && end) {
          fetchChartData(start, end);
          return;
        }
      } catch (_) {}
    }
    fetchChartData("14");
  });

  const savedTheme = localStorage.getItem("brand-dashboard-theme");
  if (savedTheme) document.body.setAttribute("data-theme", savedTheme);

  const rangeInput = document.getElementById("date-range-input");
  if (rangeInput && typeof flatpickr !== "undefined") {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const minDate = new Date(today);
    minDate.setFullYear(minDate.getFullYear() - 1);
    const defaultEnd = new Date(today);
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 13);
    defaultStart.setHours(0, 0, 0, 0);

    const savedRange = localStorage.getItem(RANGE_STORAGE_KEY);
    let defaultDates = [defaultStart, defaultEnd];
    let initialStart, initialEnd;
    if (savedRange) {
      try {
        const { start, end } = JSON.parse(savedRange);
        if (start && end) {
          defaultDates = [start, end];
          initialStart = start;
          initialEnd = end;
        }
      } catch (_) {}
    }

    flatpickrInstance = flatpickr(rangeInput, {
      mode: "range",
      dateFormat: "Y-m-d",
      minDate,
      maxDate: today,
      defaultDate: defaultDates,
      theme: document.body.getAttribute("data-theme") === "dark" ? "dark" : "light",
      onChange(selectedDates) {
        if (selectedDates.length === 2) {
          const start = toDateStr(selectedDates[0]);
          const end = toDateStr(selectedDates[1]);
          localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify({ start, end }));
          updateActiveRangeBtn(null);
          fetchChartData(start, end);
        }
      },
    });

    if (initialStart && initialEnd) {
      fetchChartData(initialStart, initialEnd);
    } else {
      fetchChartData("14");
    }
  } else {
    fetchChartData("14");
  }

  // ─── Quick-select range buttons ──────────────────────────────────────────────
  function computeRange(key) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (key === "7d") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: toDateStr(start), end: toDateStr(today) };
    }
    if (key === "last-month") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    if (key === "mtd") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toDateStr(start), end: toDateStr(today) };
    }
    return null;
  }

  function updateActiveRangeBtn(activeKey) {
    document.querySelectorAll(".range-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.range === activeKey);
    });
  }

  document.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.range;
      const range = computeRange(key);
      if (!range) return;
      updateActiveRangeBtn(key);
      localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(range));
      if (flatpickrInstance) {
        flatpickrInstance.setDate([range.start, range.end], false);
      }
      fetchChartData(range.start, range.end);
    });
  });

  fetchTwitter();
  fetchLinkedIn();
})();
