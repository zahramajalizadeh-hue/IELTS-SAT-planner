/* =========================
   IELTS + SAT PWA ENGINE
   ========================= */

const STORAGE_PREFIX = "ielts-sat-v1";

// -------------------------
// NAVIGATION
// -------------------------
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.page;

    pages.forEach(p => {
      p.classList.remove("active");
      if (p.id === target) p.classList.add("active");
    });
  });
});

// -------------------------
// STORAGE HELPERS
// -------------------------
function save(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + "-" + key, JSON.stringify(value));
  } catch (e) {
    console.error("Save error:", e);
  }
}

function load(key, fallback) {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + "-" + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

// -------------------------
// CHECKBOX SYSTEM
// -------------------------
const checkboxes = document.querySelectorAll("input[type='checkbox']");

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getWeekKey() {
  const d = new Date();
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function updateCheckbox(cb) {
  const key = cb.dataset.key;
  const state = load("tasks", {});
  state[key] = cb.checked;
  save("tasks", state);
}

function restoreCheckboxes() {
  const state = load("tasks", {});
  checkboxes.forEach(cb => {
    if (state[cb.dataset.key]) {
      cb.checked = true;
    }
  });
}

// -------------------------
// PROGRESS CALCULATION
// -------------------------
function updateProgress() {
  const all = checkboxes.length;
  const done = [...checkboxes].filter(cb => cb.checked).length;
  const percent = all === 0 ? 0 : Math.round((done / all) * 100);

  const el = document.getElementById("todayProgress");
  if (el) el.textContent = percent + "%";
}

// -------------------------
// STREAK SYSTEM
// -------------------------
function updateStreak() {
  const today = getTodayKey();

  let streakData = load("streak", {
    lastDate: null,
    streak: 0
  });

  if (streakData.lastDate) {
    const last = new Date(streakData.lastDate);
    const now = new Date(today);

    const diff = Math.floor((now - last) / 86400000);

    if (diff === 1) {
      streakData.streak += 1;
    } else if (diff > 1) {
      streakData.streak = 0;
    }
  } else {
    streakData.streak = 1;
  }

  streakData.lastDate = today;
  save("streak", streakData);

  const el = document.getElementById("streakCount");
  if (el) el.textContent = streakData.streak;
}

// -------------------------
// WEEKLY RESET
// -------------------------
function weeklyResetCheck() {
  const weekKey = getWeekKey();
  const stored = load("week", null);

  if (stored !== weekKey) {
    // reset weekly tracking
    save("week", weekKey);

    const state = load("tasks", {});
    Object.keys(state).forEach(k => state[k] = false);
    save("tasks", state);

    console.log("🔄 Weekly reset completed");
  }
}

// -------------------------
// EVENT BINDING
// -------------------------
checkboxes.forEach(cb => {
  cb.addEventListener("change", () => {
    updateCheckbox(cb);
    updateProgress();
  });
});

// -------------------------
// INIT
// -------------------------
function init() {
  weeklyResetCheck();
  restoreCheckboxes();
  updateProgress();
  updateStreak();
}

init();

// -------------------------
// SIMPLE ERROR LOGGING
// -------------------------
window.addEventListener("error", (e) => {
  const logs = load("errors", []);
  logs.push({
    time: new Date().toISOString(),
    message: e.message
  });
  save("errors", logs);
});
// -------------------------
// SERVICE WORKER REGISTRATION
// -------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg => console.log("SW registered:", reg.scope))
      .catch(err => console.log("SW failed:", err));
  });
}
