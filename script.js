/* ============================================================
   天气 Weather — 主脚本
   ============================================================ */

const CONFIG = {
  apiHost: "https://kx6r73jaef.re.qweatherapi.com",
  apiKey: "872e576533574da6b783d4e7ada87423",
  defaultLat: 39.92,
  defaultLon: 116.41,
  defaultName: "北京",
};

// 和风天气 v1 接口返回的 condition code 映射到天气类型
const CONDITION_MAP = {
  sunny: ["100", "101", "102", "103"],
  cloudy: ["104", "105", "150", "151", "152", "153"],
  overcast: ["104", "154"],
  rain: ["300", "301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316", "317", "318", "350", "351", "399"],
  snow: ["400", "401", "402", "403", "404", "405", "406", "407", "408", "409", "410", "411", "412", "413", "414", "415", "416", "417", "499"],
  thunder: ["500", "501", "502", "503", "504", "507", "508", "599"],
};

// 天气图标映射（emoji + 文字）
const ICON_MAP = {
  "100": { icon: "☀️", text: "晴" },
  "101": { icon: "🌤", text: "晴间多云" },
  "102": { icon: "⛅", text: "多云" },
  "103": { icon: "☁️", text: "阴" },
  "104": { icon: "☁️", text: "阴" },
  "150": { icon: "🌫", text: "薄雾" },
  "151": { icon: "🌫", text: "雾" },
  "300": { icon: "🌦", text: "阵雨" },
  "301": { icon: "🌧", text: "小雨" },
  "302": { icon: "🌧", text: "中雨" },
  "303": { icon: "🌧", text: "大雨" },
  "304": { icon: "🌧", text: "暴雨" },
  "400": { icon: "🌨", text: "小雪" },
  "401": { icon: "🌨", text: "中雪" },
  "402": { icon: "❄️", text: "大雪" },
  "403": { icon: "❄️", text: "暴雪" },
  "500": { icon: "⛈", text: "雷阵雨" },
  "501": { icon: "⛈", text: "雷阵雨伴冰雹" },
};

// DOM 快捷访问
const $ = (id) => document.getElementById(id);

/* ============================================================
   API 封装
   ============================================================ */
async function apiFetch(path, query = {}) {
  const url = new URL(path, CONFIG.apiHost);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url, {
    headers: { "X-QW-Api-Key": CONFIG.apiKey },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

// 实时天气 v1
function fetchCurrent(lat, lon) {
  return apiFetch(`/weather/v1/current/${lat}/${lon}`, { lang: "zh" });
}

// 逐小时预报 v1
function fetchHourly(lat, lon) {
  return apiFetch(`/weather/v1/hourly/${lat}/${lon}`, { lang: "zh" });
}

// 每日预报 v1
function fetchDaily(lat, lon) {
  return apiFetch(`/weather/v1/daily/${lat}/${lon}`, { lang: "zh" });
}

// GeoAPI 城市搜索
function geoLookup(keyword) {
  return apiFetch("/geo/v2/city/lookup", { location: keyword, lang: "zh" });
}

/* ============================================================
   UI 更新
   ============================================================ */

// 根据 condition code + 时间推断背景类型
function getWeatherType(code, isNight = false) {
  if (isNight) return "night";
  for (const [type, codes] of Object.entries(CONDITION_MAP)) {
    if (codes.includes(code)) return type;
  }
  return "cloudy";
}

// 更新动态背景
function applyBackground(code) {
  const bg = $("bgGradient");
  const now = new Date();
  const isNight = now.getHours() >= 19 || now.getHours() < 6;
  const type = getWeatherType(code, isNight);

  // 清除所有天气 class
  bg.className = "bg-gradient";
  bg.classList.add(`weather-${type}`);

  // 渲染粒子效果（仅雨/雪天）
  renderParticles(type);
}

// 粒子特效（雨/雪）
function renderParticles(type) {
  const container = $("bgParticles");
  container.innerHTML = "";

  if (type === "rain") {
    for (let i = 0; i < 60; i++) {
      const d = document.createElement("div");
      d.className = "particle rain-drop";
      d.style.left = Math.random() * 100 + "%";
      d.style.animationDuration = (0.6 + Math.random() * 0.6) + "s";
      d.style.animationDelay = Math.random() * 2 + "s";
      d.style.opacity = 0.3 + Math.random() * 0.5;
      container.appendChild(d);
    }
  } else if (type === "snow") {
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      s.className = "particle snow-flake";
      s.style.left = Math.random() * 100 + "%";
      s.style.width = s.style.height = (2 + Math.random() * 4) + "px";
      s.style.animationDuration = (4 + Math.random() * 5) + "s";
      s.style.animationDelay = Math.random() * 5 + "s";
      container.appendChild(s);
    }
  }
}

// 获取图标
function getIcon(code) {
  return ICON_MAP[code] || { icon: "🌤", text: "--" };
}

// 更新 Hero 卡片
function updateHero(data, cityName, region) {
  const { condition, temperature, feelsLike, humidity, wind, observationTime } = data;
  const icon = getIcon(condition.code);

  $("heroCity").textContent = cityName || CONFIG.defaultName;
  $("heroRegion").textContent = region || "";
  $("heroTemp").textContent = Math.round(temperature.value);
  $("heroIcon").textContent = icon.icon;
  $("heroText").textContent = condition.text || icon.text;
  $("heroFeels").textContent = Math.round(feelsLike.value);
  $("heroHumidity").textContent = Math.round(humidity * 100) + "%";

  const dirMap = { N: "北风", S: "南风", E: "东风", W: "西风",
    NE: "东北风", NW: "西北风", SE: "东南风", SW: "西南风",
    n: "北风", s: "南风", e: "东风", w: "西风",
    ne: "东北风", nw: "西北风", se: "东南风", sw: "西南风",
    ssw: "南偏西风", nnw: "北偏西风", ese: "东偏南风", wnw: "西偏北风",
    sse: "南偏东风", nne: "北偏东风", ene: "东偏北风", wsw: "西偏南风"
  };
  $("heroWindDir").textContent = dirMap[wind.direction.compass] || wind.direction.compass || "--";
  $("heroWindSpeed").textContent = wind.speed.value.toFixed(1) + " m/s";

  if (observationTime) {
    const t = new Date(observationTime);
    $("heroTime").textContent = t.toLocaleTimeString("zh-CN", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } else {
    // v1 API 不返回 observationTime，显示当前时间
    const t = new Date();
    $("heroTime").textContent = t.toLocaleTimeString("zh-CN", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }

  applyBackground(condition.code);
}

// 更新详情网格
function updateDetails(data) {
  const { wind, precipitation, visibility, uvIndex, cloudCover, pressure } = data;

  $("dWind").textContent = wind.speed.value.toFixed(1) + " m/s";
  $("dWindScale").textContent = wind.scale + " 级";

  const precipTypeMap = { none: "无降水", rain: "降雨", snow: "降雪" };
  $("dPrecip").textContent = precipitation.amount.value.toFixed(1) + " mm";
  $("dPrecipType").textContent = precipTypeMap[precipitation.type] || precipitation.type || "--";

  $("dVis").textContent = (visibility.value / 1000).toFixed(1) + " km";
  $("dUV").textContent = uvIndex !== undefined ? Math.round(uvIndex) : "--";
  $("dCloud").textContent = cloudCover !== undefined ? Math.round(cloudCover * 100) + "%" : "--";
  $("dPressure").textContent = pressure.value + " hPa";
}

// 更新逐小时预报
function updateHourly(list) {
  const container = $("hourlyScroll");
  container.innerHTML = "";

  if (!Array.isArray(list)) {
    // v1 hourly 返回格式可能不同
    console.warn("hourly data format:", list);
    return;
  }

  const now = new Date();

  list.slice(0, 24).forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "hour-card";

    // v1 hourly 字段名
    const timeStr = item.forecastTime || item.time || item.fxTime || "";
    const temp = item.temperature?.value ?? item.temp;
    const code = item.condition?.code ?? item.icon;
    const icon = getIcon(String(code || ""));

    const t = new Date(timeStr);
    const isNow = Math.abs(t - now) < 1800000 || idx === 0;
    if (isNow) card.classList.add("now");

    card.innerHTML = `
      <span class="hour-time">${t.getHours().toString().padStart(2, "0")}:00</span>
      <span class="hour-icon">${icon.icon}</span>
      <span class="hour-temp">${Math.round(temp || "--")}°</span>
    `;
    container.appendChild(card);
  });
}

// 更新每日预报
function updateDaily(list) {
  const container = $("dailyList");
  container.innerHTML = "";

  if (!Array.isArray(list)) {
    console.warn("daily data format:", list);
    return;
  }

  const dayNames = ["今天", "明天", "后天", "周四", "周五", "周六", "周日"];
  const weekFull = ["日", "一", "二", "三", "四", "五", "六"];

  // 计算温度范围用于进度条（v1: temperatureMax / temperatureMin）
  const allMax = list.map((d) => d.temperatureMax?.value).filter((v) => v !== undefined);
  const allMin = list.map((d) => d.temperatureMin?.value).filter((v) => v !== undefined);
  const absMax = Math.max(...allMax, 30);
  const absMin = Math.min(...allMin, 0);
  const range = absMax - absMin || 1;

  list.slice(0, 7).forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "day-row";

    // v1 daily: forecastStartTime, temperatureMax.value, daytime.condition
    const dateStr = item.forecastStartTime || item.date || item.fxDate || "";
    const tMax = item.temperatureMax?.value;
    const tMin = item.temperatureMin?.value;
    const dayCode = item.daytime?.condition?.code;
    const dayDesc = item.daytime?.condition?.text;
    const icon = getIcon(String(dayCode || ""));

    const t = new Date(dateStr);
    let dayLabel;
    if (idx === 0) dayLabel = "今天";
    else if (idx === 1) dayLabel = "明天";
    else dayLabel = "周" + weekFull[t.getDay()];

    const pctMin = ((tMin - absMin) / range) * 100;
    const pctMax = ((tMax - absMin) / range) * 100;

    row.innerHTML = `
      <span class="day-name">${dayLabel}</span>
      <span class="day-icon">${icon.icon}</span>
      <span class="day-desc">${dayDesc || icon.text || "--"}</span>
      <div class="day-temp-bar">
        <span class="day-temp-min">${Math.round(tMin)}°</span>
        <div class="day-temp-range">
          <div class="day-temp-fill" style="left: ${pctMin}%; width: ${pctMax - pctMin}%"></div>
        </div>
        <span class="day-temp-max">${Math.round(tMax)}°</span>
      </div>
    `;
    container.appendChild(row);
  });
}

/* ============================================================
   加载 + Toast
   ============================================================ */
function showLoader(show) {
  $("loader").classList.toggle("active", show);
}

let toastTimer = null;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("active");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("active"), 2600);
}

/* ============================================================
   主加载流程
   ============================================================ */
async function loadWeather(lat, lon, cityName, region) {
  showLoader(true);
  try {
    const [current, hourly, daily] = await Promise.all([
      fetchCurrent(lat, lon),
      fetchHourly(lat, lon),
      fetchDaily(lat, lon),
    ]);

    updateHero(current, cityName, region);
    updateDetails(current);

    // v1 hourly → .hours, daily → .days
    const hourlyList = hourly.hours || hourly.data || hourly;
    const dailyList = daily.days || daily.data || daily;
    updateHourly(hourlyList);
    updateDaily(dailyList);
  } catch (err) {
    console.error("loadWeather error:", err.message, err.stack);
    showToast("加载失败：" + err.message);
  } finally {
    showLoader(false);
  }
}

/* ============================================================
   城市搜索 + 地理定位
   ============================================================ */
const cityInput = $("cityInput");
const suggestions = $("suggestions");
let searchTimer = null;
let currentSelectionIdx = -1;

async function handleSearch() {
  const kw = cityInput.value.trim();
  if (!kw) {
    suggestions.classList.remove("active");
    return;
  }

  try {
    const data = await geoLookup(kw);
    const results = data.location || data.data || [];
    renderSuggestions(results);
  } catch (err) {
    console.error(err);
  }
}

function renderSuggestions(results) {
  suggestions.innerHTML = "";
  if (!results || results.length === 0) {
    suggestions.classList.remove("active");
    return;
  }

  results.forEach((item) => {
    const el = document.createElement("div");
    el.className = "suggestion-item";
    const addr = [item.adm1, item.adm2, item.country].filter(Boolean).join(" / ");
    el.innerHTML = `
      <span class="suggestion-name">${item.name}</span>
      <span class="suggestion-addr">${addr}</span>
    `;
    el.addEventListener("click", () => {
      const lat = item.lat;
      const lon = item.lon;
      cityInput.value = item.name;
      suggestions.classList.remove("active");
      loadAndSave(lat, lon, item.name, addr);
    });
    suggestions.appendChild(el);
  });
  suggestions.classList.add("active");
}

cityInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(handleSearch, 350);
});

cityInput.addEventListener("focus", () => {
  if (cityInput.value.trim()) handleSearch();
});

document.addEventListener("click", (e) => {
  if (!suggestions.contains(e.target) && e.target !== cityInput) {
    suggestions.classList.remove("active");
  }
});

// =========== IP 定位兜底（多个 API 轮询） ===========
async function ipGeolocation() {
  const apis = [
    // ipapi.co — 免费、CORS 友好、覆盖全球
    async () => {
      const r = await fetch("https://ipapi.co/json/");
      if (!r.ok) throw new Error("ipapi.co bad status");
      const d = await r.json();
      if (!d.latitude || !d.longitude) throw new Error("no lat/lon");
      return {
        lat: Number(d.latitude).toFixed(2),
        lon: Number(d.longitude).toFixed(2),
        name: d.city || d.region || d.country_name || "",
        region: [d.region, d.country_name].filter(Boolean).join(" / "),
      };
    },
    // ipapi.is — 备选
    async () => {
      const r = await fetch("https://api.ipapi.is/");
      if (!r.ok) throw new Error("ipapi.is bad status");
      const d = await r.json();
      if (!d.location?.lat || !d.location?.lng) throw new Error("no lat/lon");
      return {
        lat: Number(d.location.lat).toFixed(2),
        lon: Number(d.location.lng).toFixed(2),
        name: d.location.city || d.location.state || "",
        region: [d.location.state, d.location.country].filter(Boolean).join(" / "),
      };
    },
  ];

  for (const fn of apis) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 4000)),
      ]);
      if (result && result.lat) return result;
    } catch (_) { /* 下一个 */ }
  }
  throw new Error("所有 IP 定位服务均不可用");
}

// =========== 浏览器定位 → IP 定位 兜底 ===========
let geoAbortTimer = null;
async function tryGeolocation() {
  if (!navigator.geolocation) {
    showToast("浏览器不支持定位，将使用 IP 定位");
    return tryIpGeolocation();
  }

  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      clearTimeout(geoAbortTimer);
      reject(err);
    };

    geoAbortTimer = setTimeout(() => finish(new Error("timeout")), 6000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(geoAbortTimer);
        done = true;
        resolve({
          lat: pos.coords.latitude.toFixed(2),
          lon: pos.coords.longitude.toFixed(2),
        });
      },
      finish,
      { timeout: 5000, maximumAge: 600000, enableHighAccuracy: false }
    );
  }).catch(async () => {
    // 浏览器定位失败 → 自动降级 IP 定位
    showToast("浏览器定位失败，尝试 IP 定位...");
    await new Promise((r) => setTimeout(r, 600));
    return tryIpGeolocation();
  });
}

async function tryIpGeolocation() {
  const ip = await ipGeolocation();
  // IP 定位坐标 → 和风天气 GeoAPI 反查更准的城市名
  try {
    const geo = await apiFetch("/geo/v2/city/lookup", { location: `${ip.lon},${ip.lat}`, lang: "zh" });
    const r = geo.location?.[0] || geo.data?.[0];
    if (r) {
      ip.name = r.name;
      ip.region = [r.adm1, r.adm2, r.country].filter(Boolean).join(" / ");
      ip.lat = r.lat;
      ip.lon = r.lon;
    }
  } catch (_) { /* 用 IP 原始数据 */ }
  return ip;
}

// 定位按钮
$("geoBtn").addEventListener("click", async () => {
  showLoader(true);
  try {
    const pos = await tryGeolocation();
    const lat = pos.lat;
    const lon = pos.lon;
    const name = pos.name || "当前位置";
    const region = pos.region || "";
    loadAndSave(lat, lon, name, region);
  } catch (err) {
    showToast("定位失败：" + err.message);
  } finally {
    showLoader(false);
  }
});

/* ============================================================
   启动
   ============================================================ */
// 保存城市到 localStorage
function saveCity(lat, lon, name) {
  localStorage.setItem("weather_lat", lat);
  localStorage.setItem("weather_lon", lon);
  if (name) localStorage.setItem("weather_city", name);
}

// 包装 loadWeather，加载后保存
async function loadAndSave(lat, lon, cityName, region) {
  await loadWeather(lat, lon, cityName, region);
  saveCity(lat, lon, cityName);
}

// 从 localStorage 读取上次的城市
const savedCity = localStorage.getItem("weather_city");
const savedLat = localStorage.getItem("weather_lat");
const savedLon = localStorage.getItem("weather_lon");

if (savedLat && savedLon) {
  cityInput.value = savedCity || CONFIG.defaultName;
  loadWeather(savedLat, savedLon, savedCity || CONFIG.defaultName);
} else {
  loadWeather(CONFIG.defaultLat, CONFIG.defaultLon, CONFIG.defaultName);
}
