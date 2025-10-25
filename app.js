/* =========================================================
   TheXchange - App JS (Front-end only / localStorage)
   Features:
   - Auth (signup/signin) with localStorage
   - Approver role (admin) by email
   - Submit AI (requires allowed payment platform + affiliate link)
   - Approvals (admin only)
   - Home page: Search + Trending/Popular/New
   - Tool detail: Reviews
   ========================================================= */

/* =============== CONFIG =============== */
const APPROVER_EMAIL = "pjsalinari0210@gmail.com"; // you are the admin
const ALLOWED_PAYMENT_PLATFORMS = ["Stripe", "Paddle", "Lemon Squeezy", "ShareASale"]; // submit page dropdown

/* =============== STORAGE HELPERS =============== */
function getUsers() {
  try { return JSON.parse(localStorage.getItem("tx_users") || "[]"); } catch { return []; }
}
function saveUsers(list) {
  localStorage.setItem("tx_users", JSON.stringify(list));
}
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("tx_current_user") || "null"); } catch { return null; }
}
function setCurrentUser(user) {
  if (user) localStorage.setItem("tx_current_user", JSON.stringify(user));
  else localStorage.removeItem("tx_current_user");
}

function getTools() {
  try { return JSON.parse(localStorage.getItem("tx_tools") || "[]"); } catch { return []; }
}
function saveTools(list) {
  localStorage.setItem("tx_tools", JSON.stringify(list));
}

/* =============== SEED EXAMPLE TOOLS (one-time) =============== */
function maybeSeedTools() {
  const existing = getTools();
  if (existing && existing.length) return;

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d*86400000).toISOString();

  const seed = [
    {
      id: Date.now()+1,
      name: "ContentGenius AI",
      category: "Writing",
      description: "AI content creation for blogs and marketing",
      problem: "writing content creating blogs social media posts",
      priceType: "paid",
      price: 29,
      rating: 4.8,
      users: 50234,
      isPremium: true,
      creator: "ContentCorp",
      createdAt: daysAgo(90),
      features: ["Blog writing","Social posts","SEO optimization","Email copy"],
      imageUrl: "",
      url: "#",
      paymentPlatform: "Stripe",
      affiliateLink: "#",
      isExample: true,
      status: "approved", // examples appear
      reviews: []
    },
    {
      id: Date.now()+2,
      name: "CodeAssist Pro",
      category: "Development",
      description: "AI coding assistant for 50+ languages",
      problem: "coding programming debugging writing code",
      priceType: "paid",
      price: 49,
      rating: 4.9,
      users: 103445,
      isPremium: true,
      creator: "DevTools",
      createdAt: daysAgo(120),
      features: ["Code completion","Bug detection","Code review","Documentation"],
      imageUrl: "",
      url: "#",
      paymentPlatform: "Paddle",
      affiliateLink: "#",
      isExample: true,
      status: "approved",
      reviews: []
    },
    {
      id: Date.now()+3,
      name: "DesignFlow AI",
      category: "Design",
      description: "Create stunning graphics and logos",
      problem: "designing graphics creating logos making images",
      priceType: "paid",
      price: 19,
      rating: 4.7,
      users: 75892,
      isPremium: false,
      creator: "DesignStudio",
      createdAt: daysAgo(20),
      features: ["Logo design","Social graphics","Brand kits","Templates"],
      imageUrl: "",
      url: "#",
      paymentPlatform: "Lemon Squeezy",
      affiliateLink: "#",
      isExample: true,
      status: "approved",
      reviews: []
    },
    {
      id: Date.now()+4,
      name: "TaskFlow AI",
      category: "Productivity",
      description: "AI task management",
      problem: "productivity task management organizing work",
      priceType: "paid",
      price: 15,
      rating: 4.7,
      users: 67123,
      isPremium: false,
      creator: "ProductivityCo",
      createdAt: daysAgo(10),
      features: ["Smart scheduling","Priority detection","Time tracking"],
      imageUrl: "",
      url: "#",
      paymentPlatform: "ShareASale",
      affiliateLink: "#",
      isExample: true,
      status: "approved",
      reviews: []
    }
  ];

  saveTools(seed);
}

/* =============== NAV AUTH (Hi, Name / Logout / Sign In) =============== */
function renderNavAuth() {
  const slot = document.getElementById("navAuth");
  if (!slot) return;
  const u = getCurrentUser();
  if (u) {
    slot.innerHTML = `
      <span style="margin-left:8px;">Hi, ${u.name || u.email.split("@")[0]}${u.role==="admin" ? " (approver)" : ""}</span>
      <button id="logoutBtn" class="btn outline" style="margin-left:8px;">Logout</button>
    `;
    const lb = document.getElementById("logoutBtn");
    if (lb) lb.addEventListener("click", () => {
      setCurrentUser(null);
      renderNavAuth();
      // optional redirect
      if (document.body.getAttribute("data-page") !== "home") {
        window.location.href = "index.html";
      }
    });
  } else {
    slot.innerHTML = `<a href="signup.html" class="btn">Sign In</a>`;
  }
}

/* =============== AUTH PAGE (signup.html) =============== */
/* This assumes the HTML from my last message. If IDs differ, adjust here. */
function initSignupPage() {
  if (document.body.getAttribute("data-page") !== "signup") return;

  const form = document.getElementById("authForm");
  const nameWrap = document.getElementById("nameWrap");
  const accountTypeWrap = document.getElementById("accountTypeWrap");
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const accountTypeSelect = document.getElementById("accountTypeSelect");
  const btnLogin = document.getElementById("modeLogin");
  const btnSignup = document.getElementById("modeSignup");
  const errorEl = document.getElementById("authError");
  const okEl = document.getElementById("authSuccess");

  let mode = "login";

  function setMode(newMode) {
    mode = newMode;
    const isSignup = mode === "signup";
    if (nameWrap) nameWrap.style.display = isSignup ? "block" : "none";
    if (accountTypeWrap) accountTypeWrap.style.display = isSignup ? "block" : "none";
    if (btnLogin) btnLogin.className = mode === "login" ? "btn" : "btn outline";
    if (btnSignup) btnSignup.className = mode === "signup" ? "btn" : "btn outline";
    if (errorEl) errorEl.style.display = "none";
    if (okEl) okEl.style.display = "none";
  }

  setMode("login");

  if (btnLogin) btnLogin.addEventListener("click", () => setMode("login"));
  if (btnSignup) btnSignup.addEventListener("click", () => setMode("signup"));

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (errorEl) errorEl.style.display = "none";
      if (okEl) okEl.style.display = "none";

      const email = (emailInput?.value || "").trim().toLowerCase();
      const pwd = (passwordInput?.value || "").trim();

      if (!email || !pwd) {
        if (errorEl) { errorEl.textContent = "Please fill in email and password."; errorEl.style.display = "block"; }
        return;
      }

      if (mode === "signup") {
        const name = (nameInput?.value || "").trim();
        const type = accountTypeSelect?.value || "user";
        if (!name) {
          if (errorEl) { errorEl.textContent = "Please enter your full name."; errorEl.style.display = "block"; }
          return;
        }
        const users = getUsers();
        if (users.some(u => u.email === email)) {
          if (errorEl) { errorEl.textContent = "An account with this email already exists. Please sign in."; errorEl.style.display = "block"; }
          return;
        }
        const role = (email === APPROVER_EMAIL) ? "admin" : "user";
        const user = {
          id: Date.now(),
          name,
          email,
          password: pwd, // demo only
          role,
          accountType: type,
          joinedAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        setCurrentUser(user);
        if (okEl) { okEl.textContent = "Account created. Redirecting…"; okEl.style.display = "block"; }
        renderNavAuth();
        setTimeout(() => { window.location.href = "index.html"; }, 600);
        return;
      }

      if (mode === "login") {
        const users = getUsers();
        const found = users.find(u => u.email === email && u.password === pwd);
        if (!found) {
          if (errorEl) { errorEl.textContent = "Wrong email or password."; errorEl.style.display = "block"; }
          return;
        }
        setCurrentUser(found);
        if (okEl) { okEl.textContent = "Signed in. Redirecting…"; okEl.style.display = "block"; }
        renderNavAuth();
        setTimeout(() => { window.location.href = "index.html"; }, 400);
      }
    });
  }
}

/* =============== HOME PAGE (index.html) =============== */
function calculateRating(tool) {
  if (!tool.reviews || !tool.reviews.length) return tool.rating || 0;
  const avg = tool.reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / tool.reviews.length;
  return Number(avg.toFixed(1));
}

function sortTrending(tools) {
  // Recency + reviews (simple heuristic)
  return [...tools].sort((a, b) => {
    const daysA = (Date.now() - new Date(a.createdAt).getTime()) / 86400000;
    const daysB = (Date.now() - new Date(b.createdAt).getTime()) / 86400000;
    const scoreA = ((a.reviews?.length || 0) + 1) * 120 / (daysA + 2);
    const scoreB = ((b.reviews?.length || 0) + 1) * 120 / (daysB + 2);
    return scoreB - scoreA;
  });
}
function sortPopular(tools) {
  return [...tools].sort((a,b) => (b.users||0) - (a.users||0));
}
function sortNew(tools) {
  return [...tools].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function matchesSearch(tool, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    tool.name?.toLowerCase().includes(s) ||
    tool.category?.toLowerCase().includes(s) ||
    tool.description?.toLowerCase().includes(s) ||
    tool.problem?.toLowerCase().includes(s)
  );
}

function toolCardHTML(t) {
  const priceBadge = (t.priceType === "free") ? `<span class="price">Free</span>` : `<span class="price">$${t.price}/mo</span>`;
  const exampleBadge = t.isExample ? `<span class="badge example">example</span>` : ``;
  const premium = t.isPremium ? `<span class="badge premium">Premium</span>` : ``;
  const img = t.imageUrl ? `<img src="${t.imageUrl}" alt="${t.name}" class="tool-img" />` : ``;
  const rating = calculateRating(t);
  const href = `tool.html?id=${encodeURIComponent(t.id)}`;

  return `
    <div class="tool-card">
      ${premium}
      ${exampleBadge}
      ${img}
      <h3 class="tool-name">${t.name}</h3>
      <div class="tool-desc">${t.description}</div>
      <div class="tool-meta">
        <span class="rating">⭐ ${rating} (${t.reviews?.length || 0})</span>
        <span class="users">${(t.users/1000|0)}K+ users</span>
      </div>
      <div class="tool-bottom">
        ${priceBadge}
        <a class="btn primary" href="${href}">View</a>
      </div>
    </div>
  `;
}

function renderHome() {
  if (document.body.getAttribute("data-page") !== "home") return;

  const root = document.getElementById("homeRoot");
  if (!root) return;

  const toolsAll = getTools().filter(t => t.status === "approved");
  const searchInput = document.getElementById("searchInput");

  function renderAll(q = "") {
    const list = toolsAll.filter(t => matchesSearch(t, q));
    const trending = sortTrending(list).slice(0, 8);
    const popular = sortPopular(list).slice(0, 8);
    const newest = sortNew(list).slice(0, 8);

    root.innerHTML = `
      <div class="hero">
        <h1>Find your perfect AI tool</h1>
        <p>Search by what you need, browse Trending / Popular / New.</p>
        <div class="search-wrap">
          <input id="searchInputLive" class="input" placeholder="Describe your problem… e.g. 'write product descriptions'">
        </div>
      </div>

      ${q ? `<h2>Search Results (${list.length})</h2>` : ""}

      ${q ? `
        <div class="grid">
          ${list.map(toolCardHTML).join("") || `<div class="empty">No results yet. Try a different query.</div>`}
        </div>
      ` : `
        <section>
          <div class="section-title"><h2>Trending</h2></div>
          <div class="grid">${trending.map(toolCardHTML).join("")}</div>
        </section>

        <section>
          <div class="section-title"><h2>Most Popular</h2></div>
          <div class="grid">${popular.map(toolCardHTML).join("")}</div>
        </section>

        <section>
          <div class="section-title"><h2>New Arrivals</h2></div>
          <div class="grid">${newest.map(toolCardHTML).join("")}</div>
        </section>
      `}
    `;

    const searchLive = document.getElementById("searchInputLive");
    if (searchLive) {
      searchLive.value = q;
      searchLive.addEventListener("input", (e) => {
        renderAll(e.target.value || "");
      });
      // Enter submits same handler
      searchLive.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          renderAll(searchLive.value || "");
        }
      });
    }
  }

  // initial render using any existing search input on page
  let initialQuery = "";
  if (searchInput && searchInput.value) initialQuery = searchInput.value;
  renderAll(initialQuery);
}

/* =============== SUBMIT PAGE (submit.html) =============== */
function initSubmitPage() {
  if (document.body.getAttribute("data-page") !== "submit") return;

  const form = document.getElementById("submitForm");
  const nameEl = document.getElementById("toolName");
  const catEl = document.getElementById("toolCategory");
  const descEl = document.getElementById("toolDescription");
  const priceTypeEl = document.getElementById("toolPriceType");
  const priceValueEl = document.getElementById("toolPriceValue");
  const urlEl = document.getElementById("toolUrl");
  const imgEl = document.getElementById("toolImageUrl");
  const platformEl = document.getElementById("paymentPlatform");
  const affiliateEl = document.getElementById("affiliateLink");
  const noticeEl = document.getElementById("submitNotice");

  // Populate platform options if select exists
  if (platformEl && platformEl.tagName === "SELECT" && !platformEl.children.length) {
    ALLOWED_PAYMENT_PLATFORMS.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      platformEl.appendChild(opt);
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const user = getCurrentUser();
      if (!user) {
        alert("Please sign in first.");
        window.location.href = "signup.html";
        return;
      }

      const name = (nameEl?.value || "").trim();
      const category = (catEl?.value || "").trim();
      const description = (descEl?.value || "").trim();
      const priceType = (priceTypeEl?.value || "free").trim(); // "free" | "paid"
      const price = priceType === "paid" ? Number(priceValueEl?.value || 0) : 0;
      const url = (urlEl?.value || "").trim();
      const imageUrl = (imgEl?.value || "").trim();
      const paymentPlatform = (platformEl?.value || "").trim();
      const affiliateLink = (affiliateEl?.value || "").trim();

      if (!name || !category || !description || !url) {
        alert("Please fill out name, category, description, and link.");
        return;
      }
      if (priceType === "paid" && (!price || price < 0)) {
        alert("Please enter a valid monthly price for paid tools.");
        return;
      }
      if (!ALLOWED_PAYMENT_PLATFORMS.includes(paymentPlatform)) {
        alert("Please choose a valid payment platform.");
        return;
      }
      if (!/^https?:\/\//i.test(affiliateLink)) {
        alert("Please include a valid affiliate link (must start with http or https).");
        return;
      }

      const tools = getTools();
      const newTool = {
        id: Date.now(),
        name,
        category,
        description,
        problem: description.toLowerCase(), // keep it simple for search
        priceType,
        price,
        rating: 0,
        users: 0,
        isPremium: false,
        creator: user.name || user.email.split("@")[0],
        createdAt: new Date().toISOString(),
        features: [],
        imageUrl,
        url,
        paymentPlatform,
        affiliateLink,
        isExample: false,
        status: "pending",
        ownerEmail: user.email,
        reviews: []
      };

      tools.push(newTool);
      saveTools(tools);

      if (noticeEl) noticeEl.textContent = "Submitted! Waiting for approval.";
      alert("Submitted! Your AI is pending approval.");
      window.location.href = "index.html";
    });
  }

  // If admin is on submit page, optionally show pending list with approve buttons
  const adminPanel = document.getElementById("pendingList");
  const u = getCurrentUser();
  if (adminPanel && u && u.role === "admin") {
    const tools = getTools().filter(t => t.status === "pending");
    adminPanel.innerHTML = `
      <h3>Pending approvals (${tools.length})</h3>
      <div class="list">
        ${tools.map(t => `
          <div class="pending-item">
            <div>
              <strong>${t.name}</strong> — <em>${t.category}</em><br/>
              <small>by ${t.creator} · ${new Date(t.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="actions">
              <button class="btn small" data-approve="${t.id}">Approve</button>
              <button class="btn outline small" data-reject="${t.id}">Reject</button>
            </div>
          </div>
        `).join("") || `<div class="empty">No pending items.</div>`}
      </div>
    `;
    adminPanel.addEventListener("click", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const approveId = el.getAttribute("data-approve");
      const rejectId = el.getAttribute("data-reject");
      if (approveId) {
        const all = getTools();
        const idx = all.findIndex(t => String(t.id) === String(approveId));
        if (idx >= 0) {
          all[idx].status = "approved";
          saveTools(all);
          alert("Approved.");
          location.reload();
        }
      }
      if (rejectId) {
        const all = getTools();
        const idx = all.findIndex(t => String(t.id) === String(rejectId));
        if (idx >= 0) {
          all.splice(idx,1);
          saveTools(all);
          alert("Rejected & removed.");
          location.reload();
        }
      }
    });
  }
}

/* =============== TOOL DETAIL PAGE (tool.html) =============== */
function initToolPage() {
  if (document.body.getAttribute("data-page") !== "tool") return;

  const root = document.getElementById("toolRoot");
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const all = getTools();
  const tool = all.find(t => String(t.id) === String(id) && t.status === "approved");

  if (!tool) {
    root.innerHTML = `<div class="empty">Tool not found or not approved yet.</div>`;
    return;
  }

  const rating = calculateRating(tool);

  root.innerHTML = `
    <div class="tool-detail">
      <a href="index.html" class="back">← Back</a>
      ${tool.isPremium ? `<span class="badge premium">Premium</span>` : ``}
      ${tool.isExample ? `<span class="badge example">example</span>` : ``}
      <h1>${tool.name}</h1>
      <p class="muted">by ${tool.creator}</p>
      <div class="summary">
        ${tool.imageUrl ? `<img src="${tool.imageUrl}" alt="${tool.name}" class="detail-img" />` : ``}
        <div class="summary-text">
          <p>${tool.description}</p>
          <div class="meta">
            <span>⭐ ${rating} (${tool.reviews?.length || 0})</span>
            <span>${tool.users?.toLocaleString?.() || 0} users</span>
            <span>${tool.category}</span>
          </div>
          <div class="cta-row">
            ${tool.priceType === "free" ? `<div class="price">Free</div>` : `<div class="price">$${tool.price}/mo</div>`}
            <a class="btn primary" href="${tool.affiliateLink || tool.url}" target="_blank" rel="noopener">Go to tool</a>
          </div>
        </div>
      </div>

      <section>
        <h2>Reviews</h2>
        <div id="reviewsWrap">
          ${renderReviewsHTML(tool)}
        </div>

        <div id="addReviewWrap" class="add-review">
          <h3>Write a review</h3>
          <form id="reviewForm">
            <label class="label">Rating (1–5)</label>
            <input id="reviewRating" class="input" type="number" min="1" max="5" value="5" required />
            <label class="label">Your review</label>
            <textarea id="reviewText" class="input" rows="4" placeholder="Share your experience…" required></textarea>
            <button class="btn primary" type="submit">Submit Review</button>
          </form>
        </div>
      </section>
    </div>
  `;

  const form = document.getElementById("reviewForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = getCurrentUser();
      if (!u) {
        alert("Please sign in first.");
        window.location.href = "signup.html";
        return;
      }
      const ratingEl = document.getElementById("reviewRating");
      const textEl = document.getElementById("reviewText");
      const r = Number(ratingEl.value || 5);
      const text = (textEl.value || "").trim();
      if (!text) { alert("Please write a review."); return; }

      const all2 = getTools();
      const idx = all2.findIndex(t => String(t.id) === String(tool.id));
      if (idx < 0) return;

      const newReview = {
        id: Date.now(),
        userId: u.id,
        userName: u.name || u.email.split("@")[0],
        rating: Math.max(1, Math.min(5, r)),
        text,
        createdAt: new Date().toISOString(),
        helpful: 0
      };
      all2[idx].reviews = [...(all2[idx].reviews || []), newReview];
      saveTools(all2);

      // re-render reviews
      const wrap = document.getElementById("reviewsWrap");
      if (wrap) wrap.innerHTML = renderReviewsHTML(all2[idx]);
      form.reset();
      ratingEl.value = 5;
    });
  }
}

function renderReviewsHTML(tool) {
  const list = [...(tool.reviews || [])].sort((a,b) => b.helpful - a.helpful);
  if (!list.length) return `<div class="empty">No reviews yet. Be the first!</div>`;
  return `
    <div class="reviews">
      ${list.map(r => `
        <div class="review">
          <div class="review-top">
            <strong>${r.userName}</strong>
            <span>⭐ ${r.rating}</span>
          </div>
          <div class="review-date">${new Date(r.createdAt).toLocaleDateString()}</div>
          <p>${escapeHTML(r.text)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

/* =============== UTILS =============== */
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

/* =============== BOOT =============== */
document.addEventListener("DOMContentLoaded", () => {
  maybeSeedTools();
  renderNavAuth();
  initSignupPage();
  initSubmitPage();
  renderHome();
  initToolPage();
});

