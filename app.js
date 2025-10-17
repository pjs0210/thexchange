
/* ===============================
   theXchange — Frontend (no backend)
   Enforces affiliate link for ALL submissions
   =============================== */

/** <<< SET YOUR ADMIN EMAIL (approver) >>> **/
const ADMIN_EMAIL = "thexchangeceo@gmail.com";

/** <<< SET YOUR STRIPE PAYMENT LINK FOR FEATURED LISTINGS >>> **
 * Create this in Stripe: Product "Featured Listing (30 days)" -> Payment Link
 * Replace the placeholder below with your real link (test first; then live).
 */
const FEATURED_PAYMENT_LINK = "https://buy.stripe.com/test_00wcN66VafheeLn2ABdIA00";

/** Approved affiliate hosts (NO Gumroad, NO Impact if you’re skipping it for now) */
const APPROVED_AFFILIATE_HOSTS = [
  "partnerstack.com",
  "shareasale.com",
  "clickbank.net",
  "lemonsqueezy.com",
  "paddle.com"
];

/** Allowed payment systems creators can select */
const ALLOWED_PAYMENT_SYSTEMS = ["stripe", "paddle", "lemonsqueezy"];

/* ---------------- Keys (LocalStorage) ---------------- */
const LS_USER       = "thex_user";
const LS_TOOLS      = "thex_tools";
const LS_PENDING    = "thex_pending";
const LS_RECENT_CAT = "thex_recent_categories";
const LS_VIEWS      = "thex_views";

/* ---------------- DOM helper ---------------- */
const $ = (id) => document.getElementById(id);

/* ---------------- User helpers ---------------- */
function getUser(){
  try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); }
  catch { return null; }
}
function setUser(u){ localStorage.setItem(LS_USER, JSON.stringify(u)); }
function isApprover(){
  const u = getUser();
  return !!u && u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* ---------------- Seed example tools ---------------- */
const seedTools = [
  {
    id: 1,
    name: "ContentGenius AI",
    category: "writing",
    description: "AI content creation for blogs and marketing.",
    problem: "write blog posts, social captions, seo copy",
    price: 29,
    affiliateUrl: "#",
    image: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop",
    isExample: true,
    reviews: [],
    listingType: "free",
    featuredUntil: null,
    createdAt: "2024-11-15"
  },
  {
    id: 2,
    name: "CodeAssist Pro",
    category: "development",
    description: "AI coding assistant for 50+ languages.",
    problem: "debug code, autocomplete, code review",
    price: 0,
    affiliateUrl: "#",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    isExample: true,
    reviews: [],
    listingType: "free",
    featuredUntil: null,
    createdAt: "2024-12-10"
  },
  {
    id: 3,
    name: "DesignFlow AI",
    category: "design",
    description: "Create graphics and logos instantly.",
    problem: "logo design, social images, brand kits",
    price: 19,
    affiliateUrl: "#",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
    isExample: true,
    reviews: [],
    listingType: "free",
    featuredUntil: null,
    createdAt: "2025-01-15"
  }
];

/* ---------------- Storage helpers ---------------- */
function loadTools(){
  const raw = localStorage.getItem(LS_TOOLS);
  if (!raw){
    localStorage.setItem(LS_TOOLS, JSON.stringify(seedTools));
    return [...seedTools];
  }
  try { return JSON.parse(raw) || []; }
  catch { return [...seedTools]; }
}
function saveTools(arr){ localStorage.setItem(LS_TOOLS, JSON.stringify(arr)); }

function loadPending(){
  try { return JSON.parse(localStorage.getItem(LS_PENDING) || "[]"); }
  catch { return []; }
}
function savePending(arr){ localStorage.setItem(LS_PENDING, JSON.stringify(arr)); }

function bumpViews(id){
  const raw = localStorage.getItem(LS_VIEWS);
  const map = raw ? JSON.parse(raw) : {};
  map[id] = (map[id] || 0) + 1;
  localStorage.setItem(LS_VIEWS, JSON.stringify(map));
}
function getViews(id){
  const raw = localStorage.getItem(LS_VIEWS);
  const map = raw ? JSON.parse(raw) : {};
  return map[id] || 0;
}
function pushRecentCategory(cat){
  if (!cat) return;
  const raw = localStorage.getItem(LS_RECENT_CAT);
  const arr = raw ? JSON.parse(raw) : [];
  arr.unshift(cat);
  const trimmed = Array.from(new Set(arr)).slice(0, 8);
  localStorage.setItem(LS_RECENT_CAT, JSON.stringify(trimmed));
}
function getRecentCategories(){
  try { return JSON.parse(localStorage.getItem(LS_RECENT_CAT) || "[]"); }
  catch { return []; }
}

/* ---------------- URL helpers ---------------- */
function getHostname(u){
  try { return new URL(u).hostname.toLowerCase(); } catch { return ""; }
}
function affiliateHostIsApproved(url, chosenHost){
  const host = getHostname(url);
  if (!host) return false;
  const ok = APPROVED_AFFILIATE_HOSTS.includes(host);
  if (!ok) return false;
  if (chosenHost && host !== chosenHost) return false;
  return true;
}

/* ---------------- Auth (email-only) ---------------- */
function handleSignupLogin(e){
  if (e) e.preventDefault();
  const email = $("authEmail")?.value?.trim();
  const name  = $("authName")?.value?.trim() || "";
  if (!email){ alert("Enter your email"); return; }
  const user = {
    id: Date.now(),
    email,
    name: name || email.split("@")[0],
    joinedAt: new Date().toISOString()
  };
  setUser(user);
  alert(isApprover() ? "Logged in as Approver" : "Logged in");
  window.location.href = "index.html";
}
window.handleSignupLogin = handleSignupLogin;

/* ---------------- Submit (STRICT affiliate rule) ---------------- */
function handleSubmitAI(e){
  if (e) e.preventDefault();

  const name = $("toolName")?.value.trim();
  const cat  = $("toolCategory")?.value.trim().toLowerCase();
  const desc = $("toolDescription")?.value.trim();
  const problem = $("toolProblem")?.value.trim().toLowerCase() || "";
  const priceType = $("toolPriceType")?.value || "paid";
  const priceVal  = Number($("toolPriceValue")?.value || 0);

  const paymentSystem  = $("paymentSystem")?.value || "";
  const affiliatePlatform = $("affiliatePlatform")?.value || "";
  const affiliateUrl   = $("affiliateUrl")?.value?.trim();
  const image = $("toolImageUrl")?.value?.trim();

  const listingType = $("listingType")?.value || "free";
  const paymentEmail = $("paymentEmail")?.value?.trim() || "";

  if (!name || !cat || !desc){
    alert("Please fill all required fields.");
    return;
  }
  // One-sentence description rule (max one period)
  const periods = (desc.match(/\./g) || []).length;
  if (periods > 1){
    alert("Please write only ONE sentence in the description.");
    return;
  }

  // Enforce allowed payment systems
  if (!ALLOWED_PAYMENT_SYSTEMS.includes(paymentSystem)){
    alert("Please select a supported payment system (Stripe, Paddle, Lemon Squeezy).");
    return;
  }

  // Affiliate REQUIRED for EVERY submission (even Featured)
  if (!affiliateUrl){
    alert("All listings on TheXchange require a valid affiliate/referral link.");
    return;
  }
  if (!affiliateHostIsApproved(affiliateUrl, affiliatePlatform)){
    alert("Affiliate link must come from the selected approved platform (PartnerStack, ShareASale, ClickBank, Lemon Squeezy Affiliates, or Paddle Affiliates).");
    return;
  }

  // Featured requires payment email (so you can verify after Stripe checkout)
  if (listingType === "featured" && !paymentEmail){
    alert("For Featured listings, please pay first and enter your payment email.");
    return;
  }

  const price = priceType === "free" ? 0 : Math.max(0, priceVal || 0);
  const featuredUntil = (listingType === "featured")
    ? new Date(Date.now() + 1000*60*60*24*30).toISOString() // 30 days
    : null;

  const pending = loadPending();
  pending.push({
    id: Date.now(),
    name,
    category: cat,
    description: desc,
    problem,
    price,
    affiliateUrl,
    image: image || "",
    paymentSystem,
    affiliatePlatform,
    listingType,
    paymentEmail,
    isExample: false,
    reviews: [],
    createdBy: getUser()?.email || "anon",
    createdAt: new Date().toISOString(),
    featuredUntil
  });
  savePending(pending);
  alert("Submitted! We’ll review it soon.");
  window.location.href = "index.html";
}
window.handleSubmitAI = handleSubmitAI;

/* ---------------- Approver guard & queue ---------------- */
function requireApproverForQueue(){
  if (!isApprover()){
    alert("Approver access only.");
    window.location.href = "index.html";
    return false;
  }
  return true;
}
window.requireApproverForQueue = requireApproverForQueue;

function renderQueue(){
  if (!requireApproverForQueue()) return;
  const listEl = $("queueList");
  if (!listEl) return;
  const pending = loadPending();
  if (pending.length === 0){
    listEl.innerHTML = `<p>No pending submissions.</p>`;
    return;
  }
  listEl.innerHTML = pending.map(t => `
    <div class="queue-card">
      ${t.image ? `<img src="${t.image}" alt="${t.name}" class="tool-image" />` : ""}
      <h3>${t.name} ${t.listingType==="featured" ? `<span class="badge-featured">Featured (Paid)</span>`:""}</h3>
      <p class="tool-meta">${t.category} · ${t.price === 0 ? 'Free' : `$${t.price}/mo`}</p>
      <p>${t.description}</p>
      ${t.problem ? `<p class="muted"><strong>Problem:</strong> ${t.problem}</p>` : ""}
      <p><strong>Payment:</strong> ${t.paymentSystem.toUpperCase()}</p>
      <p><strong>Affiliate:</strong> ${t.affiliatePlatform} — <a href="${t.affiliateUrl}" target="_blank" rel="noopener">open</a></p>
      ${t.listingType==="featured" ? `<p><strong>Payment email:</strong> ${t.paymentEmail || "—"}</p>` : ""}
      <div class="row between" style="margin-top:10px;">
        <a class="btn" href="${t.affiliateUrl}" target="_blank" rel="noopener">Test affiliate link</a>
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
  pending.splice(idx, 1);
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

/* ---------------- Rendering helpers ---------------- */
function isCurrentlyFeatured(tool){
  if (!tool.featuredUntil) return false;
  return new Date(tool.featuredUntil).getTime() > Date.now();
}

function toolCardHTML(tool){
  const priceHtml = tool.price === 0
    ? `<span class="price-free">Free</span>`
    : `<span class="price-paid">$${tool.price}/mo</span>`;
  const featured = isCurrentlyFeatured(tool);
  return `
    <div class="tool-card">
      ${tool.image ? `<img src="${tool.image}" alt="${tool.name}" class="tool-image" />` : ""}
      <div class="row between">
        <h3 class="tool-name">${tool.name}</h3>
        <div class="row gap">
          ${tool.isExample ? `<span class="badge-example">This is an example</span>` : ``}
          ${featured ? `<span class="badge-featured">Featured</span>` : ``}
        </div>
      </div>
      <p class="tool-desc">${tool.description}</p>
      <p class="tool-meta">${priceHtml} · ${tool.category}</p>
      <div class="row between" style="margin-top:8px;">
        <a class="btn" href="tool.html?id=${tool.id}" onclick="recordView(${tool.id}, '${tool.category}')">View</a>
        ${tool.affiliateUrl ? `<a class="btn primary" href="${tool.affiliateUrl}" target="_blank" rel="noopener">Go to site</a>` : ``}
      </div>
    </div>
  `;
}

function recordView(id, cat){
  bumpViews(id);
  pushRecentCategory(cat);
}

/* ---------------- Sorting & search ---------------- */
function sortPopular(tools){ return [...tools].sort((a,b)=> getViews(b.id) - getViews(a.id)); }
function sortNew(tools){ return [...tools].sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0)); }
function sortTrending(tools){
  return [...tools].sort((a,b)=>{
    const score = (t)=>{
      const days = Math.max(1, (Date.now() - new Date(t.createdAt||Date.now()))/86400000);
      const reviews = (t.reviews||[]).length;
      const featuredBoost = isCurrentlyFeatured(t) ? 50 : 0;
      return getViews(t.id)*2 + reviews*10 + featuredBoost + (30/days);
    };
    return score(b) - score(a);
  });
}
function filterBySearch(tools, q){
  if (!q) return tools;
  const s = q.trim().toLowerCase();
  return tools.filter(t =>
    (t.name || "").toLowerCase().includes(s) ||
    (t.description || "").toLowerCase().includes(s) ||
    (t.category || "").toLowerCase().includes(s) ||
    (t.problem || "").toLowerCase().includes(s)
  );
}
function recommendForUser(tools){
  const cats = getRecentCategories();
  if (!cats.length) return [];
  const set = new Set();
  const rec = [];
  for (const cat of cats){
    for (const t of tools){
      if (t.category === cat && !set.has(t.id)){
        rec.push(t); set.add(t.id);
        if (rec.length >= 8) return rec;
      }
    }
  }
  return rec.slice(0,8);
}

/* ---------------- Homepage renderer ---------------- */
function searchBarHTML(){
  return `
    <section class="container">
      <div class="search-wrap">
        <input id="searchInput" class="search-input" placeholder="Search by name, category, or problem..." />
      </div>
    </section>
  `;
}
function sectionHTML(title, items){
  if (!items.length) return "";
  return `
    <section class="container">
      <h2 class="section-title">${title}</h2>
      <div class="grid">
        ${items.map(toolCardHTML).join("")}
      </div>
    </section>
  `;
}
function promoteBlockHTML(){
  return `
    <section class="container">
      <div class="promo">
        <div>
          <h3>Promote your AI</h3>
          <p class="muted">Featured listings are shown above others for 30 days.</p>
        </div>
        <button id="promoteBtn" class="btn primary" type="button">Get Featured</button>
      </div>
    </section>
  `;
}

function renderHome(){
  const wrap = $("homeSections");
  if (!wrap) return;

  const user = getUser();
  let tools = loadTools();
  let searchInput = null;

  function draw(){
    const q = searchInput ? (searchInput.value || "") : "";
    const all = filterBySearch(tools, q);

    const featured = all.filter(isCurrentlyFeatured);
    const trending = sortTrending(all).slice(0,8);
    const popular  = sortPopular(all).slice(0,8);
    const newest   = sortNew(all).slice(0,8);
    const rec      = user ? recommendForUser(all).slice(0,8) : [];

    wrap.innerHTML = `
      ${searchBarHTML()}
      ${user && rec.length ? sectionHTML("Recommended for you", rec) : ""}
      ${featured.length ? sectionHTML("Featured", featured.slice(0,8)) : ""}
      ${q
        ? sectionHTML(\`Search results (\${all.length})\`, all)
        : sectionHTML("Trending", trending) + sectionHTML("Popular", popular) + sectionHTML("New", newest)
      }
      ${promoteBlockHTML()}
    `;

    // bind search
    searchInput = $("searchInput");
    if (searchInput && !searchInput._wired){
      searchInput.addEventListener("input", draw);
      searchInput._wired = true;
    }

    // wire the promote button
    const payBtn = $("promoteBtn");
    if (payBtn && !payBtn._wired){
      payBtn.addEventListener("click", ()=> window.open(FEATURED_PAYMENT_LINK, "_blank"));
      payBtn._wired = true;
    }
  }

  draw();
}
window.renderHome = renderHome;

/* ---------------- Tool detail + reviews ---------------- */
function getQueryId(){
  const url = new URL(window.location.href);
  return Number(url.searchParams.get("id") || 0);
}
function findToolById(id){ return loadTools().find(t => t.id === id); }

function renderToolDetail(){
  const wrap = $("toolDetail");
  if (!wrap) return;
  const id = getQueryId();
  const tool = findToolById(id);
  if (!tool){ wrap.innerHTML = `<p>Tool not found.</p>`; return; }

  pushRecentCategory(tool.category);
  bumpViews(tool.id);

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

  const featured = isCurrentlyFeatured(tool);

  wrap.innerHTML = `
    <div class="tool-detail">
      ${tool.image ? `<img src="${tool.image}" alt="${tool.name}" class="tool-hero" />` : ""}
      <div class="row between">
        <h1>${tool.name}</h1>
        <div class="row gap">
          ${tool.isExample ? `<span class="badge-example">This is an example</span>` : ""}
          ${featured ? `<span class="badge-featured">Featured</span>` : ""}
        </div>
      </div>
      <p class="tool-meta">${priceHtml} · ${tool.category}</p>
      ${tool.problem ? `<p class="muted"><strong>Solves:</strong> ${tool.problem}</p>` : ""}
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

  const form = $("reviewForm");
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
  if (!u){
    alert("Please sign in first.");
    window.location.href = "signup.html";
    return;
  }
  const rating = Number($("reviewRating").value || 5);
  const text   = ($("reviewText").value || "").trim();
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

/* ---------------- Router ---------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  const page = document.body.getAttribute("data-page");

  if (page === "home")  renderHome();
  if (page === "queue") renderQueue();
  if (page === "tool")  renderToolDetail();

  if (page === "submit"){
    const form = $("submitForm");
    if (form) form.addEventListener("submit", handleSubmitAI);

    const payBtn = $("payFeaturedBtn");
    if (payBtn){ payBtn.addEventListener("click", ()=> window.open(FEATURED_PAYMENT_LINK, "_blank")); }

    const listingType = $("listingType");
    const payBlock = $("paidBlock");
    if (listingType && payBlock){
      const toggle = ()=> { payBlock.style.display = (listingType.value==="featured") ? "grid" : "none"; };
      listingType.addEventListener("change", toggle); toggle();
    }
  }

  if (page === "signup"){
    const authForm = $("authForm");
    if (authForm) authForm.addEventListener("submit", handleSignupLogin);
  }
});





