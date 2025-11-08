// app.js — theXchange (Firebase Auth + Firestore, scalable & secure)
import {
  ADMIN_EMAIL, auth, db,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification,
  collection, doc, addDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp, updateDoc, setDoc, deleteDoc
} from "./firebase.js";

/* ---------- Helpers ---------- */
const $ = (id)=>document.getElementById(id);
const esc = (s)=>String(s||"").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const ALLOWED_PAYMENT_PLATFORMS = ["Stripe","Paddle","Lemon Squeezy","ShareASale"];

/* ---------- Example fallback (shown only if DB empty) ---------- */
const EXAMPLE_TOOLS = [
  {id:"ex1",name:"ContentGenius AI",category:"Writing",description:"AI content for blogs & marketing",priceType:"paid",price:29,url:"#",imageUrl:"https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200",isExample:true,usersCount:52000,reviewsCount:0,isPremium:true},
  {id:"ex2",name:"CodeAssist Pro",category:"Development",description:"AI coding assistant",priceType:"paid",price:49,url:"#",imageUrl:"https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200",isExample:true,usersCount:103000,reviewsCount:0,isPremium:true},
  {id:"ex3",name:"DesignFlow AI",category:"Design",description:"Graphics & logos automatically",priceType:"paid",price:19,url:"#",imageUrl:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200",isExample:true,usersCount:76000,reviewsCount:0,isPremium:false},
  {id:"ex4",name:"TaskFlow AI",category:"Productivity",description:"Smart task management",priceType:"free",price:0,url:"#",imageUrl:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200",isExample:true,usersCount:67000,reviewsCount:0,isPremium:false}
];

/* ---------- Auth UI (navbar) ---------- */
async function renderNavAuth(user){
  const slot = $("navAuth"); if (!slot) return;
  if (user){
    const name = user.displayName || user.email;
    slot.innerHTML = `<span class="nav-user">Hi, ${esc(name)}${user.email===ADMIN_EMAIL?' (approver)':''}${user.emailVerified?'':' — verify your email'}</span> <button id="logoutBtn" class="btn small">Logout</button>`;
    $("adminLink") && ( $("adminLink").style.display = user.email===ADMIN_EMAIL ? "inline-block" : "none" );
    $("logoutBtn")?.addEventListener("click", async ()=>{ await signOut(auth); location.href="index.html"; });
  }else{
    $("adminLink") && ( $("adminLink").style.display = "none" );
    slot.innerHTML = `<a href="signup.html" class="btn small">Sign In</a>`;
  }
}

function showVerifyBanner(user){
  const b = $("verifyBanner");
  if (!b) return;
  if (user && !user.emailVerified){
    b.style.display="block";
    b.textContent = "Please verify your email (check your inbox). Some actions are locked until verification.";
  }else{
    b.style.display="none";
  }
}

/* ---------- SIGNUP PAGE ---------- */
function initSignupPage(user){
  if (document.body.getAttribute("data-page")!=="signup") return;

  const modeLogin = $("modeLogin");
  const modeSignup = $("modeSignup");
  const nameWrap = $("nameWrap");
  const accountTypeWrap = $("accountTypeWrap");
  const authForm = $("authForm");
  const nameInput = $("nameInput");
  const emailInput = $("emailInput");
  const passwordInput = $("passwordInput");
  const accountTypeSelect = $("accountTypeSelect");
  const err = $("authError");
  const ok = $("authSuccess");

  let mode = "login";
  const setMode = (m)=>{
    mode = m;
    nameWrap.style.display = m==="signup" ? "block" : "none";
    accountTypeWrap.style.display = m==="signup" ? "block" : "none";
    modeLogin.classList.toggle("active", m==="login");
    modeSignup.classList.toggle("active", m==="signup");
    err.style.display = "none"; ok.style.display = "none";
  };
  modeLogin.addEventListener("click", ()=>setMode("login"));
  modeSignup.addEventListener("click", ()=>setMode("signup"));
  setMode("login");

  authForm.addEventListener("submit", async (e)=>{
    e.preventDefault(); err.style.display="none"; ok.style.display="none";
    const email = emailInput.value.trim().toLowerCase();
    const pwd = passwordInput.value.trim();

    try{
      if (mode==="login"){
        await signInWithEmailAndPassword(auth, email, pwd);
        ok.textContent = "Signed in. Redirecting…"; ok.style.display="block";
        setTimeout(()=>location.href="index.html", 400);
      }else{
        const name = nameInput.value.trim();
        if (!name){ err.textContent="Enter your full name."; err.style.display="block"; return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        await updateProfile(cred.user, { displayName: name });

        // Set a basic user profile doc (optional)
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email,
          name,
          role: email===ADMIN_EMAIL ? "admin" : (accountTypeSelect.value||"user"),
          createdAt: serverTimestamp()
        });

        // Send verification email
        await sendEmailVerification(cred.user);
        ok.textContent = "Account created. Check your email to verify, then sign in.";
        ok.style.display="block";
      }
    }catch(e2){
      err.textContent = e2?.message || "Something went wrong.";
      err.style.display = "block";
    }
  });
}

/* ---------- HOMEPAGE ---------- */
function toolCardHTML(t){
  const priceText = t.priceType==="free" ? "Free" : `$${t.price||"?"}/mo`;
  const exampleBadge = t.isExample ? `<span class="badge warn">Example</span>` : "";
  const premiumBadge = t.isPremium ? `<span class="badge">Premium</span>` : "";
  const img = t.imageUrl || "https://via.placeholder.com/800x400?text=AI+Tool";
  const link = t.isExample ? "#" : `tool.html?id=${t.id}`;
  return `
    <div class="tool-card">
      <img src="${img}" alt="${esc(t.name)}"/>
      <div class="tool-info">
        <h3>${esc(t.name)} ${premiumBadge} ${exampleBadge}</h3>
        <p>${esc(t.description)}</p>
        <p class="meta">${esc(t.category)} • ${priceText}</p>
        <a class="btn small" href="${link}">${t.isExample?'Preview':'View'}</a>
      </div>
    </div>
  `;
}

function matchesSearch(t, q){
  if (!q) return true;
  q = q.toLowerCase();
  return (t.name||"").toLowerCase().includes(q)
      || (t.category||"").toLowerCase().includes(q)
      || (t.description||"").toLowerCase().includes(q);
}

async function renderHome(){
  if (document.body.getAttribute("data-page")!=="home") return;

  const root = $("homeRoot");
  if (!root) return;

  // fetch approved tools
  const toolsCol = collection(db, "tools");
  // newest
  let newest=[], popular=[], all=[];
  try{
    const newestSnap = await getDocs(query(toolsCol, where("status","==","approved"), orderBy("createdAt","desc"), limit(12)));
    newest = newestSnap.docs.map(d=>d.data());
  }catch{}
  try{
    const popularSnap = await getDocs(query(toolsCol, where("status","==","approved"), orderBy("usersCount","desc"), limit(12)));
    popular = popularSnap.docs.map(d=>d.data());
  }catch{}
  try{
    const allSnap = await getDocs(query(toolsCol, where("status","==","approved"), limit(50)));
    all = allSnap.docs.map(d=>d.data());
  }catch{}

  // trending calc
  const trending = [...all].sort((a,b)=>{
    const daysA = a.createdAt?.toMillis ? (Date.now()-a.createdAt.toMillis())/86400000 : 999;
    const daysB = b.createdAt?.toMillis ? (Date.now()-b.createdAt.toMillis())/86400000 : 999;
    const scoreA = ((a.reviewsCount||0)+1)*120/(daysA+2) + (a.isPremium?50:0);
    const scoreB = ((b.reviewsCount||0)+1)*120/(daysB+2) + (b.isPremium?50:0);
    return scoreB - scoreA;
  }).slice(0,12);

  // If no real tools yet, show examples
  const fallback = newest.length+popular.length+trending.length===0;

  function draw(q=""){
    const sourceAll = fallback ? EXAMPLE_TOOLS : all;
    const filtered = q ? sourceAll.filter(t=>matchesSearch(t,q)) : [];
    root.innerHTML = `
      ${q ? `<h2 class="section-heading">Search results (${filtered.length})</h2>
        <div class="grid">${filtered.map(toolCardHTML).join("") || `<div class="muted">No results yet. Try a different query.</div>`}</div>`
        : `
        <section class="section">
          <div class="section-title"><h2>New</h2></div>
          <div class="grid">${(fallback?EXAMPLE_TOOLS: newest).map(toolCardHTML).join("")}</div>
        </section>

        <section class="section">
          <div class="section-title"><h2>Most Popular</h2></div>
          <div class="grid">${(fallback?EXAMPLE_TOOLS: popular).map(toolCardHTML).join("")}</div>
        </section>

        <section class="section">
          <div class="section-title"><h2>Trending</h2></div>
          <div class="grid">${(fallback?EXAMPLE_TOOLS: trending).map(toolCardHTML).join("")}</div>
        </section>
      `}
    `;
  }
  draw("");

  const search = $("searchInputLive");
  if (search){
    search.addEventListener("input", e=>draw(e.target.value||""));
    search.addEventListener("keydown", e=>{
      if (e.key==="Enter"){ e.preventDefault(); draw(search.value||""); }
    });
  }
}

/* ---------- SUBMIT PAGE ---------- */
function populatePlatforms(){
  const sel = $("paymentPlatform");
  if (!sel) return;
  sel.innerHTML = ALLOWED_PAYMENT_PLATFORMS.map(p=>`<option value="${p}">${p}</option>`).join("");
}

function togglePriceBox(){
  const wrap = $("priceValueWrap");
  const type = $("toolPriceType");
  if (wrap && type){
    wrap.style.display = type.value==="paid" ? "block" : "none";
  }
}

function mustBeVerified(user){
  if (!user || !user.emailVerified){
    alert("Please verify your email first (check your inbox), then sign in again.");
    location.href="signup.html";
    return true;
  }
  return false;
}

function initSubmitPage(user){
  if (document.body.getAttribute("data-page")!=="submit") return;
  if (!user){ alert("Please sign in first."); location.href="signup.html"; return; }
  if (mustBeVerified(user)) return;

  populatePlatforms();
  togglePriceBox();
  $("toolPriceType")?.addEventListener("change", togglePriceBox);

  $("submitForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = $("toolName").value.trim();
    const category = $("toolCategory").value.trim();
    const description = $("toolDescription").value.trim();
    const priceType = $("toolPriceType").value;
    const priceValue = priceType==="paid" ? Number($("toolPriceValue").value||0) : 0;
    const url = $("toolUrl").value.trim();
    const imageUrl = $("toolImageUrl").value.trim();
    const paymentPlatform = $("paymentPlatform").value.trim();
    const affiliateLink = $("affiliateLink").value.trim();

    if (!name || !category || !description || !url){
      alert("Please fill out name, category, description, and website link.");
      return;
    }

    // If PAID, require platform + affiliate link; If FREE, do not require
    if (priceType==="paid"){
      if (!ALLOWED_PAYMENT_PLATFORMS.includes(paymentPlatform)){
        alert("Choose a valid affiliate/payment platform."); return;
      }
      if (!/^https?:\/\//i.test(affiliateLink)){
        alert("Affiliate link must start with http/https."); return;
      }
    }

    try{
      const id = crypto.randomUUID();
      await setDoc(doc(db,"tools",id), {
        id,
        name, category, description,
        priceType, price: priceValue,
        url, imageUrl,
        paymentPlatform: priceType==="paid" ? paymentPlatform : null,
        affiliateLink: priceType==="paid" ? affiliateLink : null,
        status: "pending",
        ownerUid: user.uid,
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        usersCount: 0,
        reviewsCount: 0,
        isExample: false,
        isPremium: false
      });
      $("submitNotice").textContent = "Submitted! Waiting for approval.";
      alert("Submitted! Your AI is pending approval.");
      location.href = "index.html";
    }catch(err){
      alert(err.message||"Submission failed.");
    }
  });
}

/* ---------- ADMIN PAGE ---------- */
async function initAdminPage(user){
  if (document.body.getAttribute("data-page")!=="admin") return;
  if (!user || user.email!==ADMIN_EMAIL){ alert("Not authorized."); location.href="index.html"; return; }

  const pendingList = $("pendingList");
  const approvedList = $("approvedList");

  // Pending
  const pSnap = await getDocs(query(collection(db,"tools"), where("status","==","pending")));
  const pending = pSnap.docs.map(d=>d.data());
  pendingList.innerHTML = pending.length ? pending.map(t=>`
    <div class="pending-item">
      <div>
        <strong>${esc(t.name)}</strong> — <em>${esc(t.category)}</em><br/>
        <small>${esc(t.description)}</small><br/>
        <small>${t.priceType==="free"?"Free":`$${t.price}/mo`} • ${esc(t.ownerEmail||"")}</small>
      </div>
      <div class="actions">
        <button class="btn small" data-approve="${t.id}">Approve</button>
        <button class="btn small outline" data-premium="${t.id}">Approve as Premium</button>
        <button class="btn small danger" data-delete="${t.id}">Delete</button>
      </div>
    </div>
  `).join("") : `<p class="muted">No pending submissions.</p>`;

  // Approved
  const aSnap = await getDocs(query(collection(db,"tools"), where("status","==","approved")));
  const approved = aSnap.docs.map(d=>d.data());
  approvedList.innerHTML = approved.length ? approved.map(t=>`
    <div class="approved-item">
      <div>
        <strong>${esc(t.name)}</strong> ${t.isPremium?'<span class="badge">Premium</span>':''} — <em>${esc(t.category)}</em><br/>
        <small>${esc(t.description)}</small>
      </div>
      <div class="actions">
        <button class="btn small danger" data-delete="${t.id}">Delete</button>
      </div>
    </div>
  `).join("") : `<p class="muted">No approved tools yet.</p>`;

  // Actions
  const handler = async (e)=>{
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const approveId = el.getAttribute("data-approve");
    const premiumId = el.getAttribute("data-premium");
    const deleteId = el.getAttribute("data-delete");

    try{
      if (approveId){
        await updateDoc(doc(db,"tools",approveId), { status:"approved", isPremium:false });
        alert("Approved."); location.reload();
      }
      if (premiumId){
        await updateDoc(doc(db,"tools",premiumId), { status:"approved", isPremium:true });
        alert("Approved as Premium."); location.reload();
      }
      if (deleteId){
        await deleteDoc(doc(db,"tools",deleteId));
        alert("Deleted."); location.reload();
      }
    }catch(err){ alert(err.message||"Action failed."); }
  };
  pendingList.addEventListener("click", handler);
  approvedList.addEventListener("click", handler);
}

/* ---------- TOOL DETAIL + REVIEWS ---------- */
async function initToolPage(user){
  if (document.body.getAttribute("data-page")!=="tool") return;
  const root = $("toolRoot"); if (!root) return;
  const id = new URLSearchParams(location.search).get("id");
  if (!id){ root.innerHTML = `<p class="muted">No tool id.</p>`; return; }

  const snap = await getDoc(doc(db,"tools",id));
  if (!snap.exists()){ root.innerHTML = `<p class="muted">Tool not found.</p>`; return; }
  const t = snap.data();
  if (t.status!=="approved"){ root.innerHTML = `<p class="muted">Tool not approved yet.</p>`; return; }

  const img = t.imageUrl || "https://via.placeholder.com/800x400?text=AI+Tool";
  $("verifyBanner") && showVerifyBanner(user);

  root.innerHTML = `
    <a class="back" href="index.html">← Back</a>
    ${t.isPremium?`<span class="badge">Premium</span>`:""}
    ${t.isExample?`<span class="badge warn">Example</span>`:""}
    <h1>${esc(t.name)}</h1>
    <p class="muted">Category: ${esc(t.category)}</p>
    <div class="detail">
      <img class="detail-img" src="${img}" alt="${esc(t.name)}" />
      <div>
        <p>${esc(t.description)}</p>
        <p class="meta">${t.priceType==="free"?"Free":`$${t.price}/mo`} • ${t.usersCount||0} users</p>
        <div class="actions" style="margin:8px 0 12px;">
          <a class="btn primary" href="${esc(t.affiliateLink||t.url)}" target="_blank" rel="noopener">Go to tool</a>
        </div>
        <h3>Reviews</h3>
        <div id="reviewsWrap"></div>
        <div class="add-review">
          <form id="reviewForm">
            <label class="label">Rating (1–5)</label>
            <input id="reviewRating" class="input" type="number" min="1" max="5" value="5" required />
            <label class="label">Your review</label>
            <textarea id="reviewText" class="input" rows="4" placeholder="Share your experience…" required></textarea>
            <button class="btn primary" type="submit">Submit Review</button>
          </form>
        </div>
      </div>
    </div>
  `;

  await renderReviews(id);

  $("reviewForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if (!user){ alert("Please sign in first."); location.href="signup.html"; return; }
    if (!user.emailVerified){ alert("Please verify your email first (check your inbox)."); return; }
    const rating = Math.max(1, Math.min(5, Number($("reviewRating").value||5)));
    const text = $("reviewText").value.trim(); if (!text){ alert("Write something."); return; }

    const rid = crypto.randomUUID();
    await setDoc(doc(db, "tools", id, "reviews", rid), {
      id: rid,
      userUid: user.uid,
      userName: user.displayName || user.email,
      rating, text,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db,"tools",id), { reviewsCount: (t.reviewsCount||0)+1 });
    $("reviewForm").reset();
    await renderReviews(id);
  });
}

async function renderReviews(id){
  const wrap = $("reviewsWrap");
  const rSnap = await getDocs(query(collection(db,"tools",id,"reviews"), orderBy("createdAt","desc")));
  const list = rSnap.docs.map(d=>d.data());
  wrap.innerHTML = list.length ? list.map(r=>`
    <div class="review">
      <div class="review-top"><strong>${esc(r.userName||"User")}</strong> • ⭐ ${r.rating}</div>
      <p>${esc(r.text)}</p>
    </div>
  `).join("") : `<div class="muted">No reviews yet. Be the first!</div>`;
}

/* ---------- BOOT ---------- */
onAuthStateChanged(auth, async (user)=>{
  await renderNavAuth(user);
  showVerifyBanner(user);
  initSignupPage(user);
  initSubmitPage(user);
  await renderHome();
  await initAdminPage(user);
  await initToolPage(user);
});
