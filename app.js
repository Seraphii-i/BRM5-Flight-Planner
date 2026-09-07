/**
 * BRM5 AVIATION OPERATIONS PLANNER
 * Core Engine & Interactivity
 */

// --- DATA DEFINITIONS ---

const BRM5_AIRCRAFT = [
  { name: "NH90 TTH", role: "UTILITY", category: "Utility" },
  { name: "UH-60V 'Black Hawk'", role: "UTILITY", category: "Utility" },
  { name: "Mi-8MTV-2 'Hip'", role: "MEDIUM LIFT", category: "Medium Lift" },
  { name: "CH-47D 'Chinook'", role: "MEDIUM LIFT", category: "Medium Lift" },
  { name: "CH-53D 'Sea Stallion'", role: "HEAVY LIFT", category: "Heavy Lift" },
  { name: "MH-6 'Little Bird'", role: "LIGHT ASSAULT", category: "Light Assault" }
];

const BRM5_LOCATIONS = [
  { name: "Forward Operating Base", x: 175, y: 440 },
  { name: "Mountain Radar Station", x: 550, y: 70 },
  { name: "Bunker", x: 535, y: 220 },
  { name: "Department of Utilities", x: 560, y: 480 },
  { name: "Lesdolina", x: 490, y: 515 },
  { name: "Fort Ronograd", x: 910, y: 380 },
  { name: "Ronograd City", x: 740, y: 500 },
  { name: "Ronograd Naval Base", x: 830, y: 620 },
  { name: "Sochraina City", x: 445, y: 755 },
  { name: "Kozlovka", x: 100, y: 800 },
  { name: "Depot", x: 60, y: 920 },
  { name: "Pushkino", x: 280, y: 880 }
];

const ACTION_OPTIONS = [
  "DEPART", "EN ROUTE", "HOLD", "LAND", "PICKUP", 
  "DROP", "INSERT", "EXTRACT", "RESUPPLY", "ORBIT", "RTB", "OTHER"
];

const NATO_ALPHABET = [
  { l: "A", p: "Alfa", s: "AL-FAH" }, { l: "B", p: "Bravo", s: "BRAH-VOH" },
  { l: "C", p: "Charlie", s: "CHAR-LEE" }, { l: "D", p: "Delta", s: "DELL-TAH" },
  { l: "E", p: "Echo", s: "ECK-OH" }, { l: "F", p: "Foxtrot", s: "FOKS-TROT" },
  { l: "G", p: "Golf", s: "GOLF" }, { l: "H", p: "Hotel", s: "HOH-TELL" },
  { l: "I", p: "India", s: "IN-DEE-AH" }, { l: "J", p: "Juliett", s: "JEW-LEE-ETT" },
  { l: "K", p: "Kilo", s: "KEY-LOH" }, { l: "L", p: "Lima", s: "LEE-MAH" },
  { l: "M", p: "Mike", s: "MIKE" }, { l: "N", p: "November", s: "NO-VEM-BER" },
  { l: "O", p: "Oscar", s: "OSS-CAH" }, { l: "P", p: "Papa", s: "PAH-PAH" },
  { l: "Q", p: "Quebec", s: "KEH-BECK" }, { l: "R", p: "Romeo", s: "ROW-ME-OH" },
  { l: "S", p: "Sierra", s: "SEE-AIR-RAH" }, { l: "T", p: "Tango", s: "TANG-GO" },
  { l: "U", p: "Uniform", s: "YOU-NEE-FORM" }, { l: "V", p: "Victor", s: "VIK-TAH" },
  { l: "W", p: "Whiskey", s: "WISS-KEY" }, { l: "X", p: "X-ray", s: "ECKS-RAY" },
  { l: "Y", p: "Yankee", s: "YANG-KEY" }, { l: "Z", p: "Zulu", s: "ZOO-LOO" }
];

const NUMBER_PRONUNCIATION = [
  { d: "0", s: "Zero" }, { d: "1", s: "Wun" }, { d: "2", s: "Too" },
  { d: "3", s: "Tree" }, { d: "4", s: "Fower" }, { d: "5", s: "Fife" },
  { d: "6", s: "Six" }, { d: "7", s: "Seven" }, { d: "8", s: "Ait" }, { d: "9", s: "Niner" }
];

// --- APP STATE ---

let currentPlan = {
  id: null,
  name: "OPERATION NIGHT HAWK",
  callsign: "RAVEN 11",
  date: new Date().toISOString().split('T')[0],
  time: "0400 Z",
  type: "Air Assault",
  status: "AMBER",
  aircraft: "UH-60V 'Black Hawk'",
  rules: "Tactical VFR",
  formation: "Single Ship",
  alt: "300 AGL",
  weather: "Clear / Light Wind",
  vis: "10 KM+",
  load: "Full Infantry + Ammo",
  cPri: "CH 01 - 121.50",
  cAlt: "CH 02 - 124.80",
  cGrd: "243.00 MHz",
  notes: "Primary objective is infantry deployment at LZ Alpha. Maintain low altitude ingress.",
  executionState: "PLANNED",
  waypoints: []
};

let settings = {
  showLabels: true,
  showRouteLines: true,
  showWpNumbers: true,
  compactMode: false
};

let draggingWpIndex = -1;
let mapImage = new Image();
mapImage.src = "assets/brm5-map.png";

// --- INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initAircraftSelector();
  initLocationSelector();
  initReferenceTables();
  initCanvas();
  initSettings();
  loadSavedPlans();
  
  // Set default date input
  document.getElementById("mDate").value = currentPlan.date;

  // Bind Form Inputs to State
  bindFormInputs();

  // Load Initial Dummy Route if empty
  if (currentPlan.waypoints.length === 0) {
    currentPlan.waypoints = [
      { name: "DEP FOB", x: 420, y: 270, grid: canvasToGrid(420, 270), alt: "500 AGL", speed: "100 KTS", action: "DEPART", notes: "Standard Ingress" },
      { name: "LZ ALPHA", x: 340, y: 360, grid: canvasToGrid(340, 360), alt: "150 AGL", speed: "60 KTS", action: "INSERT", notes: "Hot LZ Caution" },
      { name: "RTB", x: 420, y: 270, grid: canvasToGrid(420, 270), alt: "500 AGL", speed: "100 KTS", action: "RTB", notes: "Refuel & Rearm" }
    ];
  }

  renderWaypoints();
  updateBriefingCard();
  redrawMap();
});

// --- NAVIGATION ---

function initNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
      
      btn.classList.add("active");
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId).classList.add("active");

      if (btn.dataset.tab === "briefing") {
        updateBriefingCard();
      } else if (btn.dataset.tab === "archive") {
        renderArchive();
      } else if (btn.dataset.tab === "sorties") {
        renderSorties();
      }
    });
  });
}

// --- FORM & DATA BINDING ---

function initAircraftSelector() {
  const select = document.getElementById("mAircraft");
  const roleInput = document.getElementById("mAircraftRole");

  select.innerHTML = "";
  BRM5_AIRCRAFT.forEach(ac => {
    const opt = document.createElement("option");
    opt.value = ac.name;
    opt.textContent = `${ac.name} [${ac.category}]`;
    select.appendChild(opt);
  });

  select.value = currentPlan.aircraft;
  updateAircraftRole();

  select.addEventListener("change", (e) => {
    currentPlan.aircraft = e.target.value;
    updateAircraftRole();
    updateBriefingCard();
  });
}

function updateAircraftRole() {
  const select = document.getElementById("mAircraft");
  const roleInput = document.getElementById("mAircraftRole");
  const ac = BRM5_AIRCRAFT.find(a => a.name === select.value);
  if (ac) roleInput.value = `${ac.role} (${ac.category})`;
}

function initLocationSelector() {
  const select = document.getElementById("locationSelector");
  BRM5_LOCATIONS.forEach((loc, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = loc.name;
    select.appendChild(opt);
  });

  select.addEventListener("change", (e) => {
    if (e.target.value === "") return;
    const loc = BRM5_LOCATIONS[e.target.value];
    addWaypoint(loc.name.toUpperCase(), loc.x, loc.y);
    select.value = "";
  });
}

function bindFormInputs() {
  const bindings = [
    { id: "mName", key: "name" },
    { id: "mCallsign", key: "callsign" },
    { id: "mDate", key: "date" },
    { id: "mTime", key: "time" },
    { id: "mType", key: "type" },
    { id: "mStatus", key: "status" },
    { id: "pRules", key: "rules" },
    { id: "pFormation", key: "formation" },
    { id: "pAlt", key: "alt" },
    { id: "pWeather", key: "weather" },
    { id: "pVisibility", key: "vis" },
    { id: "pLoad", key: "load" },
    { id: "cPrimary", key: "cPri" },
    { id: "cAlternate", key: "cAlt" },
    { id: "cGuard", key: "cGrd" },
    { id: "mNotes", key: "notes" }
  ];

  bindings.forEach(b => {
    const el = document.getElementById(b.id);
    if (!el) return;
    el.addEventListener("input", (e) => {
      currentPlan[b.key] = e.target.value;
      updateBriefingCard();
    });
  });

  document.getElementById("savePlanBtn").addEventListener("click", saveCurrentPlan);
  document.getElementById("resetFormBtn").addEventListener("click", resetForm);
  document.getElementById("addWpManualBtn").addEventListener("click", () => addWaypoint("NEW WP", 500, 236));
  document.getElementById("clearWaypointsBtn").addEventListener("click", () => {
    currentPlan.waypoints = [];
    renderWaypoints();
    redrawMap();
  });
  document.getElementById("printBriefingBtn").addEventListener("click", () => window.print());
}

// --- GRID CONVERSION MATH ---

function canvasToGrid(x, y) {
  // Uses normalized canvas dimensions to generate 00-07 Easting and 00-03 Northing
  const canvas = document.getElementById("mapCanvas");
  const width = canvas.width || 1000;
  const height = canvas.height || 1000;

  const eVal = (x / width) * 7;
  const nVal = ((height - y) / height) * 3; // Inverted Y axis for Northing

  const eMajor = String(Math.floor(Math.max(0, Math.min(6, eVal)))).padStart(2, '0');
  const eMinor = String(Math.floor((eVal % 1) * 1000)).padStart(3, '0');

  const nMajor = String(Math.floor(Math.max(0, Math.min(2, nVal)))).padStart(2, '0');
  const nMinor = String(Math.floor((nVal % 1) * 1000)).padStart(3, '0');

  return `${eMajor} ${eMinor} / ${nMajor} ${nMinor}`;
}

// --- CANVAS MAP INTERACTION ---

function initCanvas() {
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");

  mapImage.onload = () => redrawMap();

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    document.getElementById("cursorGrid").textContent = `GRID: ${canvasToGrid(x, y)}`;

    if (draggingWpIndex !== -1) {
      currentPlan.waypoints[draggingWpIndex].x = Math.round(x);
      currentPlan.waypoints[draggingWpIndex].y = Math.round(y);
      currentPlan.waypoints[draggingWpIndex].grid = canvasToGrid(x, y);
      renderWaypoints();
      redrawMap();
    }
  });

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check hit test on existing waypoints
    const hitIdx = currentPlan.waypoints.findIndex(wp => Math.hypot(wp.x - x, wp.y - y) < 12);

    if (hitIdx !== -1) {
      draggingWpIndex = hitIdx;
    } else {
      addWaypoint(`WP ${String(currentPlan.waypoints.length + 1).padStart(2, '0')}`, x, y);
    }
  });

  window.addEventListener("mouseup", () => {
    draggingWpIndex = -1;
  });

  canvas.addEventListener("dblclick", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hitIdx = currentPlan.waypoints.findIndex(wp => Math.hypot(wp.x - x, wp.y - y) < 12);
    if (hitIdx !== -1) {
      currentPlan.waypoints.splice(hitIdx, 1);
      renderWaypoints();
      redrawMap();
    }
  });
}

function redrawMap() {
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");

  // Ensure canvas is square to match raw image aspect ratio (e.g. 1000x1000)
  canvas.width = 1000;
  canvas.height = 1000;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Raw Satellite Terrain
  if (mapImage.complete && mapImage.naturalWidth !== 0) {
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0c0e0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Draw Dynamic Tactical Grid Lines
  ctx.strokeStyle = "rgba(112, 130, 56, 0.35)";
  ctx.lineWidth = 1;
  ctx.font = "bold 11px monospace";
  ctx.fillStyle = "rgba(180, 200, 150, 0.75)";

  const cols = 7;
  const rows = 3;

  // Vertical Grid Lines (Easting 00 - 07)
  for (let i = 0; i <= cols; i++) {
    const x = (canvas.width / cols) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    if (i < cols) {
      ctx.fillText(`0${i}`, x + 6, 16);
    }
  }

  // Horizontal Grid Lines (Northing 00 - 03)
  for (let j = 0; j <= rows; j++) {
    const y = (canvas.height / rows) * j;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    if (j < rows) {
      ctx.fillText(`0${rows - 1 - j}`, 8, y + 16);
    }
  }

  // 3. Draw Compass Rose (Bottom Right)
  const cx = 930;
  const cy = 930;
  ctx.strokeStyle = "rgba(200, 210, 200, 0.5)";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy + 32);
  ctx.moveTo(cx - 32, cy); ctx.lineTo(cx + 32, cy);
  ctx.stroke();

  // Cardinal Labels
  ctx.fillStyle = "#f3f4f6";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("N", cx, cy - 36);
  ctx.fillText("S", cx, cy + 44);
  ctx.fillText("W", cx - 40, cy + 3);
  ctx.fillText("E", cx + 40, cy + 3);

  // 4. Draw Map Locations
  if (settings.showLabels) {
    BRM5_LOCATIONS.forEach(loc => {
      ctx.strokeStyle = "#d97706";
      ctx.fillStyle = "#d97706";
      ctx.lineWidth = 1.5;

      // Location Diamond Icon
      ctx.beginPath();
      ctx.moveTo(loc.x, loc.y - 4);
      ctx.lineTo(loc.x + 4, loc.y);
      ctx.lineTo(loc.x, loc.y + 4);
      ctx.lineTo(loc.x - 4, loc.y);
      ctx.closePath();
      ctx.stroke();

      // Label Text
      ctx.textAlign = "left";
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "10px monospace";
      ctx.fillText(loc.name.toUpperCase(), loc.x + 7, loc.y + 3);
    });
  }

  // 5. Draw Waypoint Route Lines
  if (settings.showRouteLines && currentPlan.waypoints.length > 1) {
    ctx.strokeStyle = "#708238";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentPlan.waypoints[0].x, currentPlan.waypoints[0].y);
    for (let i = 1; i < currentPlan.waypoints.length; i++) {
      ctx.lineTo(currentPlan.waypoints[i].x, currentPlan.waypoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 6. Draw Waypoint Markers
  currentPlan.waypoints.forEach((wp, idx) => {
    ctx.fillStyle = "#dc2626";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (settings.showWpNumbers) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), wp.x, wp.y);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(wp.name, wp.x + 11, wp.y + 3);
  });
}

// --- WAYPOINT TABLE MANAGEMENT ---

function addWaypoint(name, x, y) {
  const wpNum = currentPlan.waypoints.length + 1;
  currentPlan.waypoints.push({
    name: name || `WP ${String(wpNum).padStart(2, '0')}`,
    x: Math.round(x),
    y: Math.round(y),
    grid: canvasToGrid(x, y),
    alt: "300 AGL",
    speed: "80 KTS",
    action: "EN ROUTE",
    notes: ""
  });
  renderWaypoints();
  redrawMap();
}

function renderWaypoints() {
  const tbody = document.getElementById("waypointTbody");
  tbody.innerHTML = "";

  currentPlan.waypoints.forEach((wp, idx) => {
    const tr = document.createElement("tr");

    const actionOpts = ACTION_OPTIONS.map(opt => 
      `<option value="${opt}" ${wp.action === opt ? 'selected' : ''}>${opt}</option>`
    ).join("");

    tr.innerHTML = `
      <td><strong>${String(idx + 1).padStart(2, '0')}</strong></td>
      <td><input type="text" value="${wp.name}" data-idx="${idx}" data-field="name"></td>
      <td><input type="text" value="${wp.grid}" readonly class="readonly-input"></td>
      <td><input type="text" value="${wp.alt}" data-idx="${idx}" data-field="alt"></td>
      <td><input type="text" value="${wp.speed}" data-idx="${idx}" data-field="speed"></td>
      <td><select data-idx="${idx}" data-field="action">${actionOpts}</select></td>
      <td><input type="text" value="${wp.notes}" data-idx="${idx}" data-field="notes"></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteWaypoint(${idx})">DEL</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach live event listeners to inputs
  tbody.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("input", (e) => {
      const idx = e.target.dataset.idx;
      const field = e.target.dataset.field;
      if (idx !== undefined && field) {
        currentPlan.waypoints[idx][field] = e.target.value;
        if (field === "name") redrawMap();
        updateBriefingCard();
      }
    });
  });
}

function deleteWaypoint(idx) {
  currentPlan.waypoints.splice(idx, 1);
  renderWaypoints();
  redrawMap();
  updateBriefingCard();
}

// --- BRIEFING CARD AUTO-GENERATION ---

function updateBriefingCard() {
  document.getElementById("bName").textContent = currentPlan.name || "-";
  document.getElementById("bCallsign").textContent = currentPlan.callsign || "-";
  document.getElementById("bAircraft").textContent = `${currentPlan.aircraft} (${document.getElementById("mAircraftRole").value})`;
  document.getElementById("bType").textContent = currentPlan.type || "-";
  document.getElementById("bDateTime").textContent = `${currentPlan.date} // ${currentPlan.time}`;
  document.getElementById("bStatus").textContent = currentPlan.status || "-";

  document.getElementById("bRules").textContent = currentPlan.rules || "-";
  document.getElementById("bFormation").textContent = currentPlan.formation || "-";
  document.getElementById("bAlt").textContent = currentPlan.alt || "-";
  document.getElementById("bWeather").textContent = currentPlan.weather || "-";
  document.getElementById("bVis").textContent = currentPlan.vis || "-";
  document.getElementById("bLoad").textContent = currentPlan.load || "-";

  document.getElementById("bCommsPri").textContent = currentPlan.cPri || "-";
  document.getElementById("bCommsAlt").textContent = currentPlan.cAlt || "-";
  document.getElementById("bCommsGrd").textContent = currentPlan.cGrd || "-";

  document.getElementById("bNotes").textContent = currentPlan.notes || "None.";

  const briefTbody = document.getElementById("briefWaypointTbody");
  briefTbody.innerHTML = "";

  if (currentPlan.waypoints.length === 0) {
    briefTbody.innerHTML = `<tr><td colspan="7">NO WAYPOINTS DEFINED IN ROUTE PLAN</td></tr>`;
    return;
  }

  currentPlan.waypoints.forEach((wp, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${String(idx + 1).padStart(2, '0')}</td>
      <td><strong>${wp.name}</strong></td>
      <td>${wp.grid}</td>
      <td>${wp.alt}</td>
      <td>${wp.speed}</td>
      <td>${wp.action}</td>
      <td>${wp.notes || "-"}</td>
    `;
    briefTbody.appendChild(tr);
  });
}

// --- PERSISTENCE & ARCHIVE MANAGEMENT ---

function getSavedPlans() {
  return JSON.parse(localStorage.getItem("brm5_saved_plans") || "[]");
}

function saveSavedPlans(plans) {
  localStorage.setItem("brm5_saved_plans", JSON.stringify(plans));
}

function saveCurrentPlan() {
  let plans = getSavedPlans();

  if (!currentPlan.id) {
    currentPlan.id = 'plan_' + Date.now();
  }

  const existingIdx = plans.findIndex(p => p.id === currentPlan.id);
  if (existingIdx !== -1) {
    plans[existingIdx] = { ...currentPlan };
  } else {
    plans.push({ ...currentPlan });
  }

  saveSavedPlans(plans);
  alert(`FLIGHT PLAN '${currentPlan.name}' SAVED LOCALLY.`);
}

function resetForm() {
  currentPlan = {
    id: null,
    name: "NEW OPERATION",
    callsign: "RAVEN 11",
    date: new Date().toISOString().split('T')[0],
    time: "1200 Z",
    type: "Troop Transport",
    status: "GREEN",
    aircraft: "UH-60V 'Black Hawk'",
    rules: "VFR",
    formation: "Single Ship",
    alt: "500 AGL",
    weather: "Clear",
    vis: "10 KM+",
    load: "Standard",
    cPri: "CH 01 - 121.50",
    cAlt: "CH 02 - 124.80",
    cGrd: "243.00 MHz",
    notes: "",
    executionState: "PLANNED",
    waypoints: []
  };

  document.getElementById("mName").value = currentPlan.name;
  document.getElementById("mCallsign").value = currentPlan.callsign;
  document.getElementById("mDate").value = currentPlan.date;
  document.getElementById("mTime").value = currentPlan.time;
  document.getElementById("mType").value = currentPlan.type;
  document.getElementById("mStatus").value = currentPlan.status;
  document.getElementById("mAircraft").value = currentPlan.aircraft;
  document.getElementById("pRules").value = currentPlan.rules;
  document.getElementById("pFormation").value = currentPlan.formation;
  document.getElementById("pAlt").value = currentPlan.alt;
  document.getElementById("pWeather").value = currentPlan.weather;
  document.getElementById("pVisibility").value = currentPlan.vis;
  document.getElementById("pLoad").value = currentPlan.load;
  document.getElementById("cPrimary").value = currentPlan.cPri;
  document.getElementById("cAlternate").value = currentPlan.cAlt;
  document.getElementById("cGuard").value = currentPlan.cGrd;
  document.getElementById("mNotes").value = currentPlan.notes;

  updateAircraftRole();
  renderWaypoints();
  redrawMap();
  updateBriefingCard();
}

function loadPlanIntoPlanner(id) {
  const plans = getSavedPlans();
  const plan = plans.find(p => p.id === id);
  if (!plan) return;

  currentPlan = JSON.parse(JSON.stringify(plan));

  document.getElementById("mName").value = currentPlan.name;
  document.getElementById("mCallsign").value = currentPlan.callsign;
  document.getElementById("mDate").value = currentPlan.date;
  document.getElementById("mTime").value = currentPlan.time;
  document.getElementById("mType").value = currentPlan.type;
  document.getElementById("mStatus").value = currentPlan.status;
  document.getElementById("mAircraft").value = currentPlan.aircraft;
  document.getElementById("pRules").value = currentPlan.rules;
  document.getElementById("pFormation").value = currentPlan.formation;
  document.getElementById("pAlt").value = currentPlan.alt;
  document.getElementById("pWeather").value = currentPlan.weather;
  document.getElementById("pVisibility").value = currentPlan.vis;
  document.getElementById("pLoad").value = currentPlan.load;
  document.getElementById("cPrimary").value = currentPlan.cPri;
  document.getElementById("cAlternate").value = currentPlan.cAlt;
  document.getElementById("cGuard").value = currentPlan.cGrd;
  document.getElementById("mNotes").value = currentPlan.notes;

  updateAircraftRole();
  renderWaypoints();
  redrawMap();
  updateBriefingCard();

  // Switch tab to planner
  document.querySelector('.nav-btn[data-tab="planner"]').click();
}

function renderArchive() {
  const container = document.getElementById("archiveList");
  const search = document.getElementById("archiveSearch").value.toLowerCase();
  const sort = document.getElementById("archiveSort").value;

  let plans = getSavedPlans();

  // Search Filter
  if (search) {
    plans = plans.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.callsign.toLowerCase().includes(search) ||
      p.aircraft.toLowerCase().includes(search)
    );
  }

  // Sorting
  if (sort === "newest") plans.reverse();
  else if (sort === "name") plans.sort((a, b) => a.name.localeCompare(b.name));

  container.innerHTML = "";

  if (plans.length === 0) {
    container.innerHTML = `<div class="full-width" style="color:var(--text-dim); padding:20px 0;">NO SAVED FLIGHT PLANS FOUND IN ARCHIVE.</div>`;
    return;
  }

  plans.forEach(plan => {
    const card = document.createElement("div");
    card.className = "archive-card";
    card.innerHTML = `
      <div class="archive-card-header">
        <div>
          <div class="archive-card-title">${plan.name}</div>
          <div class="archive-card-callsign">${plan.callsign}</div>
        </div>
        <span class="btn btn-sm" style="background:#222;">${plan.status}</span>
      </div>
      <div class="archive-card-body">
        <div><strong>AIRCRAFT:</strong> ${plan.aircraft}</div>
        <div><strong>TYPE:</strong> ${plan.type}</div>
        <div><strong>DATE:</strong> ${plan.date}</div>
        <div><strong>WAYPOINTS:</strong> ${plan.waypoints ? plan.waypoints.length : 0}</div>
      </div>
      <div class="archive-card-actions">
        <button class="btn btn-primary btn-sm" onclick="loadPlanIntoPlanner('${plan.id}')">LOAD PLAN</button>
        <button class="btn btn-secondary btn-sm" onclick="duplicatePlan('${plan.id}')">DUPLICATE</button>
        <button class="btn btn-danger btn-sm" onclick="deletePlan('${plan.id}')">DELETE</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function duplicatePlan(id) {
  const plans = getSavedPlans();
  const plan = plans.find(p => p.id === id);
  if (!plan) return;

  const dup = JSON.parse(JSON.stringify(plan));
  dup.id = 'plan_' + Date.now();
  dup.name = `${dup.name} (COPY)`;

  plans.push(dup);
  saveSavedPlans(plans);
  renderArchive();
}

function deletePlan(id) {
  if (!confirm("CONFIRM: DELETE FLIGHT PLAN FROM ARCHIVE?")) return;
  let plans = getSavedPlans();
  plans = plans.filter(p => p.id !== id);
  saveSavedPlans(plans);
  renderArchive();
}

function loadSavedPlans() {
  document.getElementById("archiveSearch").addEventListener("input", renderArchive);
  document.getElementById("archiveSort").addEventListener("change", renderArchive);

  document.getElementById("deleteAllPlansBtn").addEventListener("click", () => {
    if (confirm("CRITICAL WARNING: PURGE ALL SAVED FLIGHT PLANS?")) {
      localStorage.removeItem("brm5_saved_plans");
      renderArchive();
    }
  });

  document.getElementById("exportAllJson").addEventListener("click", () => {
    const plans = getSavedPlans();
    const blob = new Blob([JSON.stringify(plans, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BRM5_Flight_Plans_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  });

  document.getElementById("importJsonInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          saveSavedPlans(imported);
          renderArchive();
          alert("FLIGHT PLANS IMPORTED SUCCESSFULLY.");
        }
      } catch (err) {
        alert("ERROR PARSING JSON FILE.");
      }
    };
    reader.readAsText(file);
  });
}

// --- SORTIE LOG ---

function renderSorties() {
  const tbody = document.getElementById("sortieTbody");
  const plans = getSavedPlans();

  tbody.innerHTML = "";

  if (plans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">NO SORTIES RECORDED IN SYSTEM. SAVE A FLIGHT PLAN TO GENERATE SORTIE ENTRIES.</td></tr>`;
    return;
  }

  plans.forEach(p => {
    const tr = document.createElement("tr");
    const states = ["PLANNED", "ACTIVE", "COMPLETED", "ABORTED"];
    const stateOpts = states.map(s => `<option value="${s}" ${p.executionState === s ? 'selected' : ''}>${s}</option>`).join("");

    tr.innerHTML = `
      <td><strong>${p.callsign}</strong></td>
      <td>${p.name}</td>
      <td>${p.aircraft}</td>
      <td>${p.type}</td>
      <td>${p.date}</td>
      <td>${p.status}</td>
      <td><select onchange="updateSortieState('${p.id}', this.value)">${stateOpts}</select></td>
      <td><button class="btn btn-secondary btn-sm" onclick="loadPlanIntoPlanner('${p.id}')">VIEW PLAN</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateSortieState(id, newState) {
  const plans = getSavedPlans();
  const plan = plans.find(p => p.id === id);
  if (plan) {
    plan.executionState = newState;
    saveSavedPlans(plans);
  }
}

// --- REFERENCE DATA TABLES ---

function initReferenceTables() {
  const natoTbody = document.getElementById("natoTable");
  NATO_ALPHABET.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${item.l}</strong></td><td>${item.p}</td><td><code>${item.s}</code></td>`;
    natoTbody.appendChild(tr);
  });

  const numTbody = document.getElementById("numberTable");
  NUMBER_PRONUNCIATION.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${item.d}</strong></td><td><code>${item.s}</code></td>`;
    numTbody.appendChild(tr);
  });
}

// --- SETTINGS MANAGEMENT ---

function initSettings() {
  const setLabels = document.getElementById("setLabels");
  const setRouteLines = document.getElementById("setRouteLines");
  const setWpNumbers = document.getElementById("setWpNumbers");
  const setCompact = document.getElementById("setCompact");

  setLabels.addEventListener("change", (e) => { settings.showLabels = e.target.checked; redrawMap(); });
  setRouteLines.addEventListener("change", (e) => { settings.showRouteLines = e.target.checked; redrawMap(); });
  setWpNumbers.addEventListener("change", (e) => { settings.showWpNumbers = e.target.checked; redrawMap(); });
  
  setCompact.addEventListener("change", (e) => {
    settings.compactMode = e.target.checked;
    if (settings.compactMode) document.body.classList.add("compact-mode");
    else document.body.classList.remove("compact-mode");
  });

  document.getElementById("resetAppConfigBtn").addEventListener("click", () => {
    setLabels.checked = true;
    setRouteLines.checked = true;
    setWpNumbers.checked = true;
    setCompact.checked = false;
    document.body.classList.remove("compact-mode");
    settings = { showLabels: true, showRouteLines: true, showWpNumbers: true, compactMode: false };
    redrawMap();
  });

  document.getElementById("purgeStorageBtn").addEventListener("click", () => {
    if (confirm("PURGE ALL STORAGE DATA INCLUDING PLANS AND PREFERENCES?")) {
      localStorage.clear();
      location.reload();
    }
  });
}
