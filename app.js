/**
 * JTI Fitness Tracker (Vanilla JS)
 *
 * Quick run:
 * 1) Open index.html directly in your browser, OR
 * 2) Serve this folder (e.g. python3 -m http.server 8000) and open http://localhost:8000
 *
 * AI scan concept:
 * - The app currently uses a MOCK function (analyzeMealWithAIMock) for local use.
 * - To use a real ChatGPT-style vision API, update AI_CONFIG and replace the mock call
 *   with analyzeMealWithAIRealApi() in handleAIScanSubmit.
 */

// ========================
// AI API CONFIG (single place to configure)
// ========================
const AI_CONFIG = {
  API_BASE_URL: "https://api.example.com", // Replace with your real endpoint
  MODEL: "gpt-4.1-mini", // Example model name; replace as needed
  API_KEY: "YOUR_API_KEY_HERE", // Never commit a real key
  ENDPOINT_PATH: "/api/food-analysis" // Example route for your backend or provider
};

const STORAGE_KEYS = {
  weight: "jti_weight_entries",
  food: "jti_food_entries",
  workouts: "jti_workout_entries",
  prefs: "jti_user_prefs"
};

const state = {
  weightEntries: [],
  foodEntries: [],
  workoutEntries: [],
  prefs: { dailyTarget: 2200 }
};

const els = {
  tabButtons: document.querySelectorAll(".tab-btn"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  todayCalories: document.getElementById("todayCalories"),
  todayMacros: document.getElementById("todayMacros"),
  todayWorkout: document.getElementById("todayWorkout"),
  latestWeight: document.getElementById("latestWeight"),
  weightDelta: document.getElementById("weightDelta"),
  dailyTarget: document.getElementById("dailyTarget"),
  calorieProgressBar: document.getElementById("calorieProgressBar"),
  calorieProgressText: document.getElementById("calorieProgressText"),

  weightForm: document.getElementById("weightForm"),
  weightMessage: document.getElementById("weightMessage"),
  weightTableBody: document.getElementById("weightTableBody"),
  weightChart: document.getElementById("weightChart"),
  dashboardWeightChart: document.getElementById("dashboardWeightChart"),

  foodForm: document.getElementById("foodForm"),
  foodMessage: document.getElementById("foodMessage"),
  foodFilterDate: document.getElementById("foodFilterDate"),
  foodTableBody: document.getElementById("foodTableBody"),
  dailyCalories: document.getElementById("dailyCalories"),
  dailyProtein: document.getElementById("dailyProtein"),
  dailyCarbs: document.getElementById("dailyCarbs"),
  dailyFats: document.getElementById("dailyFats"),

  aiScanForm: document.getElementById("aiScanForm"),
  mealPhotoInput: document.getElementById("mealPhotoInput"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  aiStatus: document.getElementById("aiStatus"),
  aiPreview: document.getElementById("aiPreview"),
  aiDescription: document.getElementById("aiDescription"),
  aiCalories: document.getElementById("aiCalories"),
  aiProtein: document.getElementById("aiProtein"),
  aiCarbs: document.getElementById("aiCarbs"),
  aiFats: document.getElementById("aiFats"),

  workoutForm: document.getElementById("workoutForm"),
  workoutMessage: document.getElementById("workoutMessage"),
  weeklyWorkoutCount: document.getElementById("weeklyWorkoutCount"),
  workoutGroups: document.getElementById("workoutGroups"),

  exportBtn: document.getElementById("exportBtn"),
  clearBtn: document.getElementById("clearBtn"),
  settingsMessage: document.getElementById("settingsMessage")
};

init();

function init() {
  hydrateState();
  setDefaultDates();
  bindEvents();
  renderAll();
}

function bindEvents() {
  els.tabButtons.forEach(btn => btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));

  els.weightForm.addEventListener("submit", handleWeightSubmit);
  els.foodForm.addEventListener("submit", handleFoodSubmit);
  els.foodFilterDate.addEventListener("change", renderFood);
  els.aiScanForm.addEventListener("submit", handleAIScanSubmit);
  els.workoutForm.addEventListener("submit", handleWorkoutSubmit);

  els.dailyTarget.addEventListener("change", () => {
    const value = Number(els.dailyTarget.value);
    state.prefs.dailyTarget = Number.isFinite(value) && value > 0 ? value : 2200;
    saveState();
    renderDashboard();
  });

  els.exportBtn.addEventListener("click", exportData);
  els.clearBtn.addEventListener("click", clearAllData);
}

function setActiveTab(tabId) {
  els.tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
  els.tabPanels.forEach(panel => panel.classList.toggle("active", panel.id === tabId));
}

function setDefaultDates() {
  const today = formatDate(new Date());
  els.weightForm.elements.date.value = today;
  els.foodForm.elements.date.value = today;
  els.foodFilterDate.value = today;
  els.workoutForm.elements.date.value = today;
  els.dailyTarget.value = state.prefs.dailyTarget || 2200;
}

function hydrateState() {
  state.weightEntries = readStore(STORAGE_KEYS.weight, []);
  state.foodEntries = readStore(STORAGE_KEYS.food, []);
  state.workoutEntries = readStore(STORAGE_KEYS.workouts, []);
  state.prefs = readStore(STORAGE_KEYS.prefs, { dailyTarget: 2200 });
}

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.weight, JSON.stringify(state.weightEntries));
  localStorage.setItem(STORAGE_KEYS.food, JSON.stringify(state.foodEntries));
  localStorage.setItem(STORAGE_KEYS.workouts, JSON.stringify(state.workoutEntries));
  localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(state.prefs));
}

function renderAll() {
  renderDashboard();
  renderWeight();
  renderFood();
  renderWorkouts();
}

function handleWeightSubmit(e) {
  e.preventDefault();
  const { date, value, note } = e.target.elements;
  if (!date.value || !value.value) return showMessage(els.weightMessage, "Please complete required fields.", true);

  state.weightEntries.push({
    id: crypto.randomUUID(),
    date: date.value,
    value: Number(value.value),
    note: note.value.trim()
  });

  state.weightEntries.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  e.target.reset();
  setDefaultDates();
  showMessage(els.weightMessage, "Weight saved.");
  renderAll();
}

function handleFoodSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const required = ["date", "name", "calories", "protein", "carbs", "fats"];
  const missing = required.some(field => !f[field].value);
  if (missing) return showMessage(els.foodMessage, "Please fill all food fields.", true);

  state.foodEntries.push({
    id: crypto.randomUUID(),
    date: f.date.value,
    name: f.name.value.trim(),
    calories: Number(f.calories.value),
    protein: Number(f.protein.value),
    carbs: Number(f.carbs.value),
    fats: Number(f.fats.value),
    isEstimate: Boolean(f.isEstimate.checked)
  });

  state.foodEntries.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  e.target.reset();
  setDefaultDates();
  showMessage(els.foodMessage, "Food entry saved.");
  renderAll();
}

async function handleAIScanSubmit(e) {
  e.preventDefault();
  const file = els.mealPhotoInput.files?.[0];
  if (!file) return showMessage(els.aiStatus, "Please choose an image first.", true);

  showMessage(els.aiStatus, "Analyzing meal image...");
  els.analyzeBtn.disabled = true;

  try {
    // For local demo: mocked response
    const prediction = await analyzeMealWithAIMock(file);

    // For real API usage: replace the line above with this line:
    // const prediction = await analyzeMealWithAIRealApi(file);

    els.aiPreview.classList.remove("hidden");
    els.aiDescription.textContent = prediction.description;
    els.aiCalories.textContent = prediction.calories;
    els.aiProtein.textContent = prediction.protein;
    els.aiCarbs.textContent = prediction.carbs;
    els.aiFats.textContent = prediction.fats;

    // Prefill food form and mark as estimate so user can edit then save.
    const foodFields = els.foodForm.elements;
    foodFields.name.value = prediction.suggestedName || "AI Meal Estimate";
    foodFields.calories.value = prediction.calories;
    foodFields.protein.value = prediction.protein;
    foodFields.carbs.value = prediction.carbs;
    foodFields.fats.value = prediction.fats;
    foodFields.isEstimate.checked = true;

    showMessage(els.aiStatus, "Estimate ready. Review/edit values in the food form, then save.");
  } catch (err) {
    showMessage(els.aiStatus, `AI analysis failed: ${err.message}`, true);
  } finally {
    els.analyzeBtn.disabled = false;
  }
}

/**
 * MOCK AI analyzer for local development.
 * Simulates network delay and returns static-ish macro estimates.
 */
function analyzeMealWithAIMock(file) {
  return new Promise(resolve => {
    const roughSizeKb = Math.max(1, Math.round(file.size / 1024));
    const calories = Math.min(900, 350 + Math.floor(roughSizeKb / 10));

    setTimeout(() => {
      resolve({
        description: "Estimated meal: grilled chicken bowl with rice, mixed vegetables, and sauce.",
        suggestedName: "Chicken Rice Bowl (AI)",
        calories,
        protein: 35,
        carbs: 42,
        fats: 14
      });
    }, 1100);
  });
}

/**
 * REAL API EXAMPLE (commented usage):
 * - Convert the image to base64
 * - Send to your backend/provider ChatGPT-style vision endpoint
 * - Return parsed calories/macros
 */
async function analyzeMealWithAIRealApi(file) {
  const base64Image = await fileToBase64(file);

  const response = await fetch(`${AI_CONFIG.API_BASE_URL}${AI_CONFIG.ENDPOINT_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_CONFIG.API_KEY}`
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL,
      // Exact payload depends on provider schema.
      // This sample is intentionally generic.
      input: {
        image_base64: base64Image,
        prompt: "Estimate meal calories and macros. Return JSON with description, calories, protein, carbs, fats."
      }
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  // Adjust parsing based on your real API response shape.
  const data = await response.json();
  return {
    description: data.description,
    suggestedName: data.suggestedName || "AI Meal",
    calories: Number(data.calories),
    protein: Number(data.protein),
    carbs: Number(data.carbs),
    fats: Number(data.fats)
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handleWorkoutSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const required = ["date", "session", "exercise", "sets", "reps", "weight"];
  const missing = required.some(field => !f[field].value);
  if (missing) return showMessage(els.workoutMessage, "Please complete all workout fields.", true);

  state.workoutEntries.push({
    id: crypto.randomUUID(),
    date: f.date.value,
    session: f.session.value.trim(),
    exercise: f.exercise.value.trim(),
    sets: Number(f.sets.value),
    reps: Number(f.reps.value),
    weight: Number(f.weight.value)
  });

  state.workoutEntries.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  e.target.reset();
  setDefaultDates();
  showMessage(els.workoutMessage, "Workout saved.");
  renderAll();
}

function renderDashboard() {
  const today = formatDate(new Date());
  const foodToday = state.foodEntries.filter(entry => entry.date === today);
  const workoutsToday = state.workoutEntries.filter(entry => entry.date === today);
  const totals = sumFood(foodToday);

  els.todayCalories.textContent = `${totals.calories} kcal`;
  els.todayMacros.textContent = `${totals.protein}g / ${totals.carbs}g / ${totals.fats}g`;
  els.todayWorkout.textContent = workoutsToday.length ? "Yes ✅" : "No";

  const latestTwo = [...state.weightEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  if (latestTwo[0]) {
    els.latestWeight.textContent = `${latestTwo[0].value}`;
    if (latestTwo[1]) {
      const delta = Number((latestTwo[0].value - latestTwo[1].value).toFixed(1));
      const dir = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
      els.weightDelta.textContent = `${dir} ${Math.abs(delta)} vs previous`;
    } else {
      els.weightDelta.textContent = "No previous data";
    }
  } else {
    els.latestWeight.textContent = "—";
    els.weightDelta.textContent = "No data";
  }

  const target = Number(state.prefs.dailyTarget) || 2200;
  const pct = Math.min(100, Math.round((totals.calories / target) * 100));
  els.calorieProgressBar.style.width = `${pct}%`;
  els.calorieProgressText.textContent = `${totals.calories} / ${target} kcal (${pct}%)`;

  drawSimpleLineChart(els.dashboardWeightChart, state.weightEntries.map(x => ({ x: x.date, y: x.value })), "Weight");
}

function renderWeight() {
  const rows = [...state.weightEntries].sort((a, b) => b.date.localeCompare(a.date));
  els.weightTableBody.innerHTML = rows.length
    ? rows.map(r => `<tr><td>${r.date}</td><td>${r.value}</td><td>${escapeHtml(r.note || "—")}</td></tr>`).join("")
    : `<tr><td colspan="3" class="muted">No entries yet.</td></tr>`;

  drawSimpleLineChart(els.weightChart, state.weightEntries.map(x => ({ x: x.date, y: x.value })), "Weight");
}

function renderFood() {
  const selectedDate = els.foodFilterDate.value || formatDate(new Date());
  const entries = state.foodEntries.filter(entry => entry.date === selectedDate);
  const totals = sumFood(entries);

  els.dailyCalories.textContent = totals.calories;
  els.dailyProtein.textContent = `${totals.protein}g`;
  els.dailyCarbs.textContent = `${totals.carbs}g`;
  els.dailyFats.textContent = `${totals.fats}g`;

  const rows = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  els.foodTableBody.innerHTML = rows.length
    ? rows.map(r => `
      <tr>
        <td>${r.date}</td><td>${escapeHtml(r.name)}</td><td>${r.calories}</td>
        <td>${r.protein}</td><td>${r.carbs}</td><td>${r.fats}</td>
        <td>${r.isEstimate ? "AI estimate" : "Manual"}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7" class="muted">No food entries for this day.</td></tr>`;
}

function renderWorkouts() {
  const grouped = groupBy(state.workoutEntries, x => `${x.date}__${x.session}`);
  const keys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  els.workoutGroups.innerHTML = keys.length ? keys.map(key => {
    const [date, session] = key.split("__");
    const lines = grouped[key]
      .map(item => `<li>${escapeHtml(item.exercise)} — ${item.sets} x ${item.reps} @ ${item.weight}</li>`)
      .join("");
    return `<article class="session-group"><h4>${date} · ${escapeHtml(session)}</h4><ul>${lines}</ul></article>`;
  }).join("") : "<p class='muted'>No workouts logged yet.</p>";

  const weeklyCount = countWorkoutsThisWeek(state.workoutEntries);
  els.weeklyWorkoutCount.textContent = String(weeklyCount);
}

function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    ...state
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jti-fitness-export-${formatDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showMessage(els.settingsMessage, "Data exported.");
}

function clearAllData() {
  const ok = window.confirm("This will delete all locally stored entries. Continue?");
  if (!ok) return;

  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  state.weightEntries = [];
  state.foodEntries = [];
  state.workoutEntries = [];
  state.prefs = { dailyTarget: 2200 };
  setDefaultDates();
  saveState();
  renderAll();
  showMessage(els.settingsMessage, "All data cleared.");
}

function sumFood(entries) {
  return entries.reduce((acc, cur) => {
    acc.calories += cur.calories;
    acc.protein += cur.protein;
    acc.carbs += cur.carbs;
    acc.fats += cur.fats;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

function countWorkoutsThisWeek(entries) {
  const now = new Date();
  const firstDay = new Date(now);
  const day = (now.getDay() + 6) % 7; // Monday-indexed
  firstDay.setDate(now.getDate() - day);
  firstDay.setHours(0, 0, 0, 0);

  return entries.filter(e => new Date(e.date) >= firstDay).length;
}

function drawSimpleLineChart(canvas, points, yLabel) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (!points.length) {
    ctx.fillStyle = "#5f6b7a";
    ctx.font = "14px sans-serif";
    ctx.fillText("No data yet.", 20, 30);
    return;
  }

  const padding = 40;
  const ys = points.map(p => Number(p.y));
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;

  // Axes
  ctx.strokeStyle = "#bfd0ea";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding / 2);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding / 2, height - padding);
  ctx.stroke();

  // Line
  ctx.strokeStyle = "#3f7cff";
  ctx.lineWidth = 2;
  ctx.beginPath();

  points.forEach((point, i) => {
    const x = padding + (i * (width - padding * 1.5)) / Math.max(1, points.length - 1);
    const y = height - padding - ((point.y - minY) / rangeY) * (height - padding * 1.5);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  ctx.fillStyle = "#1d4fd7";
  points.forEach((point, i) => {
    const x = padding + (i * (width - padding * 1.5)) / Math.max(1, points.length - 1);
    const y = height - padding - ((point.y - minY) / rangeY) * (height - padding * 1.5);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Labels
  ctx.fillStyle = "#4d5e78";
  ctx.font = "12px sans-serif";
  ctx.fillText(`${yLabel}: ${minY} → ${maxY}`, padding, 14);
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle("error", isError);
}

function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function groupBy(list, getKey) {
  return list.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
