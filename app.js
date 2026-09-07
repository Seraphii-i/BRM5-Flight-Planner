const KEY="brm5-flight-plans-v1";
let plans=JSON.parse(localStorage.getItem(KEY)||"[]");
let editingId=null;

const $=id=>document.getElementById(id);
const val=id=>$(id).value;

function nowLocal(){
  const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
}
$("missionDate").value=nowLocal();

function makeWp(data={}){
  const row=document.createElement("div");
  row.className="waypoint";
  row.innerHTML=`
    <div class="wpno"></div>
    <label>NAME<input class="wp-name" placeholder="LZ / CP / FOB" value="${esc(data.name||"")}"></label>
    <label>GRID<input class="wp-grid" placeholder="MF 123 456" value="${esc(data.grid||"")}"></label>
    <label>ALT<input class="wp-alt" placeholder="500 AGL" value="${esc(data.alt||"")}"></label>
    <label>ACTION<input class="wp-action" placeholder="LAND / HOLD / DROP" value="${esc(data.action||"")}"></label>
    <button class="remove" title="Remove waypoint">×</button>`;
  row.querySelector(".remove").onclick=()=>{row.remove(); renumber();};
  $("waypoints").appendChild(row); renumber();
}
function renumber(){
  [...document.querySelectorAll(".waypoint")].forEach((r,i)=>r.querySelector(".wpno").textContent=String(i+1).padStart(2,"0"));
  const n=document.querySelectorAll(".waypoint").length;
  $("routeSummary").textContent=n?`${n} WAYPOINT${n===1?"":"S"} DEFINED // ROUTE READY FOR BRIEFING`:"NO WAYPOINTS DEFINED";
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function collect(){
  return {
    id:editingId||crypto.randomUUID(), created:new Date().toISOString(),
    missionName:val("missionName")||"UNTITLED MISSION", missionDate:val("missionDate"),
    missionType:val("missionType"), roe:val("roe"), flightType:val("flightType"),
    formation:val("formation"), altitude:val("altitude"), weather:val("weather"),
    loadout:val("loadout"), comms:val("comms"), aircraft:val("aircraft"),
    callsign:val("callsign"), notes:val("missionNotes"),
    waypoints:[...document.querySelectorAll(".waypoint")].map(r=>({
      name:r.querySelector(".wp-name").value,grid:r.querySelector(".wp-grid").value,
      alt:r.querySelector(".wp-alt").value,action:r.querySelector(".wp-action").value
    }))
  };
}
function loadPlan(p){
  editingId=p.id;
  ["missionName","missionDate","missionType","roe","flightType","formation","altitude","weather","loadout","comms","aircraft","callsign","missionNotes"]
    .forEach(k=>{if($(k)&&p[k]!=null) $(k).value=p[k]});
  $("waypoints").innerHTML=""; (p.waypoints||[]).forEach(makeWp); show("planner"); renderBrief();
}
function resetPlan(){
  editingId=null;
  $("missionName").value=""; $("missionDate").value=nowLocal(); $("missionNotes").value="";
  $("waypoints").innerHTML=""; renumber(); renderBrief();
}
function save(){
  const p=collect(), idx=plans.findIndex(x=>x.id===p.id);
  if(idx>=0) plans[idx]=p; else plans.unshift(p);
  localStorage.setItem(KEY,JSON.stringify(plans)); editingId=p.id; renderSaved(); renderBrief();
  alert("Flight plan saved locally.");
}
function renderSaved(){
  $("savedCount").textContent=plans.length;
  $("savedList").innerHTML=plans.length?plans.map(p=>`
    <div class="saved-card">
      <div><strong>${esc(p.missionName)}</strong><div class="saved-meta">${esc(p.callsign)} · ${esc(p.missionType)} · ${p.waypoints.length} WPs · ${new Date(p.created).toLocaleString()}</div></div>
      <div class="saved-actions"><button class="btn small load" data-id="${p.id}">LOAD</button><button class="btn small danger del" data-id="${p.id}">DELETE</button></div>
    </div>`).join(""):`<div class="panel muted">NO SAVED FLIGHT PLANS. Create one in the planner and press SAVE FLIGHT PLAN.</div>`;
  document.querySelectorAll(".load").forEach(b=>b.onclick=()=>loadPlan(plans.find(p=>p.id===b.dataset.id)));
  document.querySelectorAll(".del").forEach(b=>b.onclick=()=>{plans=plans.filter(p=>p.id!==b.dataset.id);localStorage.setItem(KEY,JSON.stringify(plans));renderSaved();});
}
function renderBrief(){
  const p=collect();
  $("briefCard").innerHTML=`
    <div class="brief-head"><div class="brief-title">${esc(p.missionName)}</div><div>${esc(p.callsign)} // ${esc(p.aircraft)}</div></div>
    <div class="brief-grid">
      ${field("MISSION",p.missionType)}${field("DATE / TIME",p.missionDate?new Date(p.missionDate).toLocaleString():"—")}
      ${field("FLIGHT RULES",p.flightType)}${field("FORMATION",p.formation)}
      ${field("ALTITUDE",p.altitude)}${field("WEATHER",p.weather)}
      ${field("LOAD / CONFIG",p.loadout)}${field("COMMS",p.comms)}
      ${field("ROE / STATUS",p.roe)}${field("AIRCRAFT",p.aircraft)}
    </div>
    <div class="brief-wps"><strong>ROUTE</strong><table><thead><tr><th>WP</th><th>NAME</th><th>GRID</th><th>ALT</th><th>ACTION</th></tr></thead><tbody>
    ${p.waypoints.map((w,i)=>`<tr><td>${String(i+1).padStart(2,"0")}</td><td>${esc(w.name)}</td><td>${esc(w.grid)}</td><td>${esc(w.alt)}</td><td>${esc(w.action)}</td></tr>`).join("")||"<tr><td colspan='5'>NO WAYPOINTS</td></tr>"}
    </tbody></table></div>
    <div class="brief-notes"><strong>MISSION NOTES</strong><br>${esc(p.notes||"None.")}</div>`;
}
function field(a,b){return `<div class="brief-field"><span>${a}</span><strong>${esc(b||"—")}</strong></div>`}

function show(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.section===id));
}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>{show(n.dataset.section);if(n.dataset.section==="saved")renderSaved();if(n.dataset.section==="brief")renderBrief()});
$("addWp").onclick=()=>makeWp();
$("savePlan").onclick=save;
$("newPlan").onclick=resetPlan;
$("printBrief").onclick=()=>window.print();
$("clearPlans").onclick=()=>{if(confirm("Delete all locally saved flight plans?")){plans=[];localStorage.removeItem(KEY);renderSaved();}};
$("exportData").onclick=()=>{
  const blob=new Blob([JSON.stringify(plans,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="brm5-flight-plans.json";a.click();URL.revokeObjectURL(a.href);
};
$("importData").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x))throw 0;plans=x;localStorage.setItem(KEY,JSON.stringify(plans));renderSaved();alert("Plans imported.")}catch{alert("Invalid flight plan JSON.")}};r.readAsText(f);
};
["missionName","missionDate","missionType","roe","flightType","formation","altitude","weather","loadout","comms","aircraft","callsign","missionNotes"].forEach(id=>$(id).addEventListener("input",renderBrief));
makeWp({name:"START",grid:"",alt:"500 AGL",action:"DEPART"});
renderSaved();renderBrief();
