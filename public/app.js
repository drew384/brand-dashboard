(function () {
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

  async function fetchTwitter() {
    showTwitterLoading();
    try {
      const res = await fetch("/api/twitter");
      const data = await res.json();
      if (!res.ok) {
        showTwitterError(data.error?.message || data.error || "Failed to load Twitter data");
        return;
      }
      showTwitterData(data);
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
        showLinkedInError(data.error?.message || data.error || "Failed to load LinkedIn data");
        return;
      }
      showLinkedInData(data);
    } catch (err) {
      showLinkedInError(err.message || "Network error");
    }
  }

  fetchTwitter();
  fetchLinkedIn();
})();
