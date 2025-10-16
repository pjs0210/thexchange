/* ===============================
   theXchange – core client logic
   =============================== */

/** <<< SET TO YOUR EMAIL >>> **/
const ADMIN_EMAIL = "pjsalinari0210@gmail.com";

/* LocalStorage keys */
const LS_USER    = "thex_user";
const LS_TOOLS   = "thex_tools";
const LS_PENDING = "thex_pending";

/* ---------- User helpers ---------- */
function getUser() {
  try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch { return null; }
}
function setUser(u) { localStorage.setItem(LS_USER, JSON.stringify(u)); }
function isApprover() {
  const u = getUser();
  return !!u && u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* ---------- Seed (example) data ---------- */
const seedTools = [
  {
    id: 1,
    name: "ContentGenius AI",
    category: "writing",
    description: "AI content creation for blogs and marketing.",
    price: 29, // $/mo
    affiliateUrl: "#",
    image: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop",
    isExample: true,
    reviews: []
  },
  {
    id: 2,
    name: "CodeAssist Pro",
    category: "development",
    description: "AI coding assistant for 50+ languages.",
    price: 0, // Free
    affiliateUrl: "#",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    isExample: true,
    reviews: []
  },
  {
    id: 3,
    name: "DesignFlow AI",
    category: "design",
    description: "Create graphics and logos instantly.",
    price: 19,
    affiliateUrl: "#",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
    isExample: true,
    reviews: []
  }
];

function loadTools() {
  const raw = localStorage.getItem(LS_TOOLS);
  if (!raw) {
    localStorage.setItem(LS_TOOLS, JSON.stringify(seedTools));
    return [...seedTools];
  }
  try { return JSON.parse(raw) || []; } catch { return [...seedTools]; }
}
function saveTools(arr) { localStorage.setItem(LS_TOOLS, JSON.stringify(arr)); }

function loadPending() {
  try { return JSON.parse(localStorage.getItem(LS_PENDING) || "[]"); } catch { return []; }
}
function savePending(arr) { localStorage.setItem(LS_PENDING, JSON.stringify(arr)); }

/* ---------- DOM helpers ---------- */
const byId = (id) => document.getElementById(id);
const qs   = (sel) => document.querySelector(sel);

/* ---------- Auth (simple email sign-in) ---------- */
function handleSignupLogin(e) {
  if (e) e.preventDefault();
  const email = byId("authEmail")?.value?.trim();
  const name  = byId("authName")?.value?.trim() || "";
  if (!email) { alert("Enter your email"); return; }

  const user = {
    id: Date.now(),
    email,
    name: name || email.split("@")[0],
    accountType: "user",
    joinedAt: new Date().toISOString()
  };
  setUser(user);
  alert(isApprover() ? "Logged in as Approver" : "Logged in");
  window.location.href = "index.html";
}
window.handleSignupLogin = handleSignupLogin;

/* ---------- Submit AI (one sentence; image; free/paid) ---------- */
function handleSubmitAI(e) {
  if (e) e.preventDefault();
  const name = byId("toolName")?.value.trim();
  const cat  = byId("toolCategory")?.value.trim().toLowerCase();
  const desc = byId("toolDescription")?.value.trim();
  const priceType = byId("toolPriceType")?.value || "free";
  const priceVal  = Number(byId("toolPriceValue")?.value || 0);
  const url   = byId("toolUrl")?.value.trim();
  const image = byId("toolImageUrl")?.value.trim();

  if (!name || !cat || !desc || !url) { alert("Please fill all required fields."); return; }

  // One-sentence rule: allow at most one period
  const periods = (desc.match(/\./g) || []).length;
  if (periods > 1) { alert("Please write only ONE sentence in the description."); return; }

  const price = priceType === "free" ? 0 : Math.max(0, priceVal || 0);

  const pending = loadPending();
  pending.push({
    id: Date.now(),
    name,
    category: cat,
    description: desc,
    price,
    affiliateUrl: url,
    image: image || "",
    isExample: false,
    reviews: [],
    createdBy: getUser()?.email || "anon",
    createdAt: new Date().toISOString()
  });
  savePending(pending);
  alert("Submitted! We’ll review it soon.");
  window.location.href = "index.html";
}
window.handleSubmitAI = handleSubmitAI;

/* ---------- Approver-only: queue page guard ---------- */
function requireApproverForQueue() {
  if (!isApprover()) {
    alert("Approver access only.");
    window.location.href = "index.html";
    return false;
  }
  return true;
}
window.requireApproverForQueue = requireApproverForQueue;

/* ---------- Queue rendering & actions ---------- */
function renderQueue(){
  if (!requireApproverForQueue()) return;
  const listEl = byId("queueList");
  if (!listEl) return;
  const pending = loadPending();
  if (pending.length === 0) {
    listEl.innerHTML = `<p>No pending submissions.</p>`;
    return;
  }
  listEl.innerHTML = pending.map(t => `
    <div class="queue-card">
      ${t.image ? `<img src="${t.image}" alt="${t.name}" class="tool-image" />` : ""}
      <h3>${t.name}</h3>
      <p class="tool-meta">${t.category} · ${t.price === 0 ? 'Free' : `$${t.price}/mo`}</p>
      <p>${t.description}</p>
      <div class="row between" style="margin-top:10px;">
        <a class="btn" href="${t.affiliateUrl}" target="_blank" rel="noopener">View Link</a>
        <div class="spacer"></div>
        <button class="btn primary" onclick="approveTool(${t.id})">Approve</button>
        <button class="btn" onclick="rejectTool(${t.id})">Reject</button>
      </div>
    </div>
  `).join("");
}
window.renderQueue = renderQueue;

function approveTool(id){
  if (!isApprover()) { alert("Approver only."); return; }
  const pending = loadPending();
  const tools   = loadTools();
  const idx = pending.findIndex(t => t.id === id);
  if (idx === -1) return;
  const item = pending[idx];
  pending.splice(idx,1);
  tools.push(item);
  savePending(pending);
  saveTools(tools);
  renderQueue();
}
window.approveTool = approveTool;

function rejectTool(id){
  if (!isApprover()) { alert("Approver only."); return; }
  const filtered = loadPending().filter(t => t.id !== id);
  savePending(filtered);
  renderQueue();
}
window.rejectTool = rejectTool;

/* ---------- Home rendering (cards) ---------- */
function renderHome(){
  const grid = byId("toolsGrid");
  if (!grid) return;
  const tools = loadTools();
  if (!tools.length){
    grid.innerHTML = `<div class="empty-state">No tools yet. Be the first to <a href="submit.html">submit one</a>.</div>`;
    return;
  }
  grid.innerHTML = tools.map(tool => toolCardHTML(tool)).join("");
}
window.renderHome = renderHome;

function toolCardHTML(tool){
  const priceHtml = tool.price === 0
    ? `<span class="price-free">Free</span>`
    : `<span class="price-paid">$${tool.price}/mo</span>`;
  return `
    <div class="tool-card">
      ${tool.image ? `<img src="${tool.image}" alt="${tool.name}" class="tool-image" />` : ""}
      <div class="row between">
        <h3 class="tool-name">${tool.name}</h3>
        ${tool.isExample ? `<span class="badge-example">This is an example</span>` : ``}
      </div>
      <p class="tool-desc">${tool.description}</p>
      <p class="tool-meta">${priceHtml} · ${tool.category}</p>
      <div class="row between" style="margin-top:8px;">
        <a class="btn" href="tool.html?id=${tool.id}">View</a>
        ${tool.affiliateUrl ? `<a class="btn primary" href="${tool.affiliateUrl}" target="_blank" rel="noopener">Go to site</a>` : ``}
      </div>
    </div>
  `;
}

/* ---------- Tool detail + reviews ---------- */
function getQueryId(){
  const url = new URL(window.location.href);
  return Number(url.searchParams.get("id") || 0);
}
function findToolById(id){
  const tools = loadTools();
  return tools.find(t => t.id === id);
}
function renderToolDetail(){
  const wrap = byId("toolDetail");
  if (!wrap) return;
  const id = getQueryId();
  const tool = findToolById(id);
  if (!tool) { wrap.innerHTML = `<p>Tool not found.</p>`; return; }

  const priceHtml = tool.price === 0
    ? `<span class="price-free">Free</span>`
    : `<span class="price-paid">$${tool.price}/mo</span>`;

  const reviewsHtml = (tool.reviews || []).length
    ? tool.reviews.map(r => `
        <div class="review">
          <div class="row between">
            <strong>${r.userName || "User"}</strong>
            <span>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
          </div>
          <p>${r.text}</p>
        </div>
      `).join("")
    : `<p class="muted">No reviews yet. Be the first!</p>`;

  wrap.innerHTML = `
    <div class="tool-detail">
      ${tool.image ? `<img src="${tool.image}" alt="${tool.name}" class="tool-hero" />` : ""}
      <div class="row between">
        <h1>${tool.name}</h1>
        ${tool.isExample ? `<span class="badge-example">This is an example</span>` : ``}
      </div>
      <p class="tool-meta">${priceHtml} · ${tool.category}</p>
      <p>${tool.description}</p>
      <div class="row gap" style="margin:10px 0 16px;">
        ${tool.affiliateUrl ? `<a class="btn primary" href="${tool.affiliateUrl}" target="_blank" rel="noopener">Go to site</a>` : ``}
        <a class="btn" href="index.html">Back</a>
      </div>

      <hr />

      <h2>Reviews</h2>
      <div id="reviewsWrap">${reviewsHtml}</div>

      <form id="reviewForm" class="review-form">
        <label>Rating
          <select id="reviewRating">
            <option value="5">★★★★★</option>
            <option value="4">★★★★☆</option>
            <option value="3">★★★☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="1">★☆☆☆☆</option>
          </select>
        </label>
        <label>Comment
          <input id="reviewText" maxlength="200" placeholder="One short sentence (max 200 chars)" />
        </label>
        <button class="btn primary">Submit review</button>
      </form>
    </div>
  `;

  const form = byId("reviewForm");
  if (form){
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      addReview(tool.id);
    });
  }
}
window.renderToolDetail = renderToolDetail;

function addReview(toolId){
  const u = getUser();
  if (!u){ alert("Please sign in first."); window.location.href = "signup.html"; return; }

  const rating = Number(byId("reviewRating").value || 5);
  const text   = (byId("reviewText").value || "").trim();
  if (!text){ alert("Please write a short comment."); return; }

  const tools = loadTools();
  const idx = tools.findIndex(t => t.id === toolId);
  if (idx === -1) return;
  tools[idx].reviews = tools[idx].reviews || [];
  tools[idx].reviews.push({
    id: Date.now(),
    userId: u.id,
    userName: u.name || (u.email?.split("@")[0] || "User"),
    rating,
    text,
    createdAt: new Date().toISOString()
  });
  saveTools(tools);
  renderToolDetail();
}

/* ---------- Page router ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  const page = document.body.getAttribute("data-page");

  if (page === "home")  renderHome();
  if (page === "queue") renderQueue();
  if (page === "tool")  renderToolDetail();

  const submitForm = byId("submitForm");
  if (page === "submit" && submitForm) submitForm.addEventListener("submit", handleSubmitAI);

  const authForm = byId("authForm");
  if (page === "signup" && authForm) authForm.addEventListener("submit", handleSignupLogin);
});

