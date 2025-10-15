/* =========================
   theXchange — multi-page app (no framework)
   Data: localStorage
   Pages: index, signup, submit, queue, tool
   ========================= */

const STORAGE_KEYS = {
  user: 'thex_user',
  tools: 'thex_tools',
  pending: 'thex_pending',
};

const CATEGORIES = ['Writing','Development','Design','Video','Analytics','Audio','Marketing','Productivity'];

const SEED_TOOLS = [
  { id: 1, name: 'ContentGenius AI', category: 'Writing', description: 'AI content creation for blogs and marketing', problem: 'writing, content, blogs, social', price: 29, rating: 4.8, reviews: [], users: 50234, isPremium: true, creator: 'ContentCorp', createdAt: '2024-11-15', features: ['Blog writing','Social posts','SEO optimization','Email copy'], affiliateUrl: 'https://example.com/contentgen?ref=thexchange' },
  { id: 2, name: 'CodeAssist Pro', category: 'Development', description: 'AI coding assistant for 50+ languages', problem: 'coding, programming, debugging', price: 49, rating: 4.9, reviews: [], users: 103445, isPremium: true, creator: 'DevTools', createdAt: '2024-10-20', features: ['Code completion','Bug detection','Code review','Docs'], affiliateUrl: 'https://example.com/codeassist?ref=thexchange' },
  { id: 3, name: 'DesignFlow AI', category: 'Design', description: 'Create stunning graphics and logos', problem: 'design, graphics, logos', price: 19, rating: 4.7, reviews: [], users: 75892, isPremium: false, creator: 'DesignStudio', createdAt: '2025-01-05', features: ['Logo design','Social graphics','Brand kits','Templates'], affiliateUrl: 'https://example.com/designflow?ref=thexchange' },
  { id: 4, name: 'VideoMaster AI', category: 'Video', description: 'AI video editing and generation', problem: 'editing videos, captions, effects', price: 39, rating: 4.6, reviews: [], users: 31267, isPremium: true, creator: 'VideoTech', createdAt: '2024-12-10', features: ['Auto editing','Subtitles','Effects','Generation'], affiliateUrl: 'https://example.com/videomaster?ref=thexchange' },
  { id: 5, name: 'DataAnalyzer Pro', category: 'Analytics', description: 'AI-powered data analysis', problem: 'analysis, charts, insights', price: 79, rating: 4.9, reviews: [], users: 22156, isPremium: false, creator: 'DataWorks', createdAt: '2024-09-15', features: ['Predictive','Visualization','Reports','AI insights'], affiliateUrl: 'https://example.com/dataanalyzer?ref=thexchange' },
  { id: 6, name: 'VoiceClone AI', category: 'Audio', description: 'Clone and generate AI voices', problem: 'voiceovers, tts, audio', price: 25, rating: 4.5, reviews: [], users: 42891, isPremium: false, creator: 'AudioLabs', createdAt: '2025-01-20', features: ['Voice cloning','TTS','Multilingual'], affiliateUrl: 'https://example.com/voiceclone?ref=thexchange' },
  { id: 7, name: 'MarketBoost AI', category: 'Marketing', description: 'AI marketing automation', problem: 'ads, campaigns, growth', price: 99, rating: 4.8, reviews: [], users: 18734, isPremium: true, creator: 'MarketingPro', createdAt: '2024-11-01', features: ['Ad optimization','A/B tests','Analytics','Automation'], affiliateUrl: 'https://example.com/marketboost?ref=thexchange' },
  { id: 8, name: 'TaskFlow AI', category: 'Productivity', description: 'AI task management', problem: 'tasks, planning, scheduling', price: 15, rating: 4.7, reviews: [], users: 67123, isPremium: false, creator: 'ProductivityCo', createdAt: '2025-01-15', features: ['Smart scheduling','Priority detection','Time tracking'], affiliateUrl: 'https://example.com/taskflow?ref=thexchange' },
];

// ---------- Utilities ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function nowISO(){ return new Date().toISOString(); }

function read(key, fallback){
  const raw = localStorage.getItem(key);
  if(!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function ensureSeed(){
  if(!read(STORAGE_KEYS.tools)) write(STORAGE_KEYS.tools, SEED_TOOLS);
  if(!read(STORAGE_KEYS.pending)) write(STORAGE_KEYS.pending, []);
}
ensureSeed();

// ---------- Auth ----------
function currentUser(){ return read(STORAGE_KEYS.user, null); }

function setSignedInUI(){
  const link = $('#accountLink');
  if(!link) return;
  const user = currentUser();
  link.textContent = user ? `Hi, ${user.name}` : 'Sign Up / Sign In';
  link.href = 'signup.html';
}

// ---------- Sorting / filtering ----------
function calcAvgRating(tool){
  if(!tool.reviews || tool.reviews.length===0) return Number(tool.rating || 0).toFixed(1);
  const avg = tool.reviews.reduce((a,r)=>a+(r.rating||0),0)/tool.reviews.length;
  return avg.toFixed(1);
}
function sortTrending(tools){
  return [...tools].sort((a,b)=>{
    const daysA=(Date.now()-Date.parse(a.createdAt))/86400000;
    const daysB=(Date.now()-Date.parse(b.createdAt))/86400000;
    const scoreA = ((a.reviews?.length||0)+1)*100/(daysA+1);
    const scoreB = ((b.reviews?.length||0)+1)*100/(daysB+1);
    return scoreB - scoreA;
  });
}
function sortPopular(tools){ return [...tools].sort((a,b)=>(b.users||0)-(a.users||0)); }
function sortNew(tools){ return [...tools].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)); }

function filterByQuery(tools, q){
  if(!q) return tools;
  const s = q.toLowerCase();
  return tools.filter(t =>
    t.name.toLowerCase().includes(s) ||
    (t.description||'').toLowerCase().includes(s) ||
    (t.problem||'').toLowerCase().includes(s)
  );
}

// ---------- Render helpers ----------
function toolCardHTML(t){
  return `
    <div class="tool-card">
      ${t.isPremium ? `<span class="badge">Premium</span>` : ``}
      <h4>${t.name}</h4>
      <p class="muted">${t.category} • ${calcAvgRating(t)}★ • ${(t.users/1000).toFixed(0)}k+ users</p>
      <p>${t.description}</p>
      <div class="row" style="margin-top:8px;">
        <div><span class="price">$${t.price}</span>/mo</div>
        <div>
          <a class="btn" href="tool.html?id=${t.id}">View</a>
        </div>
      </div>
    </div>
  `;
}

// ---------- Page controllers ----------
document.addEventListener('DOMContentLoaded', () => {
  $('#year') && ($('#year').textContent = new Date().getFullYear());
  setSignedInUI();

  const page = document.body.dataset.page;

  if(page==='home') initHome();
  if(page==='signup') initSignup();
  if(page==='submit') initSubmit();
  if(page==='queue') initQueue();
  if(page==='tool') initTool();
});

// HOME
function initHome(){
  const tools = read(STORAGE_KEYS.tools, []);
  const cards = $('#cards');
  const tabs = $$('.tab');
  const search = $('#searchInput');

  function render(list){ cards.innerHTML = list.map(toolCardHTML).join(''); }

  function doRender(tab='trending'){
    let q = search.value.trim();
    let base = filterByQuery(tools, q);
    if(tab==='trending') render(sortTrending(base));
    if(tab==='popular') render(sortPopular(base));
    if(tab==='new') render(sortNew(base));
  }

  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      doRender(btn.dataset.tab);
    });
  });

  search.addEventListener('input', ()=>{
    const active = $('.tab.active').dataset.tab;
    doRender(active);
  });

  doRender('trending');
}

// SIGNUP
function initSignup(){
  const signupForm = $('#signupForm');
  const signinForm = $('#signinForm');
  const logoutBtn = $('#logoutBtn');
  const signedInAs = $('#signedInAs');

  const user = currentUser();
  if(user){
    signedInAs.textContent = `Signed in as ${user.name} (${user.accountType})`;
    logoutBtn.style.display = 'inline-block';
  }

  signupForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(signupForm);
    const user = {
      id: Date.now(),
      name: fd.get('name').trim(),
      email: fd.get('email').trim().toLowerCase(),
      password: fd.get('password'),
      accountType: fd.get('accountType'),
      joinedAt: nowISO(),
    };
    write(STORAGE_KEYS.user, user);
    alert('Account created and signed in!');
    location.href = 'index.html';
  });

  signinForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(signinForm);
    const email = fd.get('email').trim().toLowerCase();
    const password = fd.get('password');

    const saved = currentUser();
    if(saved && saved.email===email && saved.password===password){
      alert('Signed in!');
      location.href = 'index.html';
    } else {
      // super-basic demo signin: if no account exists, create a temp user
      if(!saved){
        const temp = { id: Date.now(), name: email.split('@')[0], email, password, accountType:'user', joinedAt: nowISO() };
        write(STORAGE_KEYS.user, temp);
        alert('Signed in (new temp account created).');
        location.href = 'index.html';
      } else {
        alert('Email/password do not match the stored account.');
      }
    }
  });

  logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem(STORAGE_KEYS.user);
    alert('Logged out.');
    location.reload();
  });
}

// SUBMIT
function initSubmit(){
  const form = $('#submitForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const user = currentUser();
    if(!user){
      alert('Please sign in first.');
      location.href = 'signup.html';
      return;
    }
    const fd = new FormData(form);
    const pending = read(STORAGE_KEYS.pending, []);
    pending.push({
      id: Date.now(),
      name: fd.get('name').trim(),
      category: fd.get('category'),
      description: fd.get('description').trim(),
      problem: (fd.get('problem')||'').trim(),
      price: Number(fd.get('price')||0),
      rating: 4.5,
      reviews: [],
      users: Math.floor(Math.random()*50000)+1000,
      isPremium: false,
      creator: user.name,
      createdAt: new Date().toISOString().slice(0,10),
      features: ['Great features','Fast setup','Loved by users'],
      affiliateUrl: (fd.get('affiliateUrl')||'').trim(),
      submittedBy: user.id,
    });
    write(STORAGE_KEYS.pending, pending);
    alert('Submitted! Awaiting approval.');
    form.reset();
    location.href = 'index.html';
  });
}

// QUEUE (Approver only)
function initQueue(){
  const user = currentUser();
  const list = $('#queueList');
  const hint = $('#queueHint');

  if(!user || user.accountType!=='approver'){
    hint.textContent = 'You must be signed in as an Approver to manage submissions.';
    list.innerHTML = '';
    return;
  }

  const pending = read(STORAGE_KEYS.pending, []);
  if(pending.length===0){
    list.innerHTML = '<p class="muted">No pending submissions.</p>';
    return;
  }

  list.innerHTML = pending.map(p => `
    <div class="tool-card">
      <h4>${p.name}</h4>
      <p class="muted">${p.category} • submitted by ${p.creator}</p>
      <p>${p.description}</p>
      <div class="row" style="margin-top:8px;">
        <div><span class="price">$${p.price}</span>/mo</div>
        <div>
          <button class="btn" data-approve="${p.id}">Approve</button>
          <button class="btn danger" data-reject="${p.id}">Reject</button>
        </div>
      </div>
    </div>
  `).join('');

  list.addEventListener('click',(e)=>{
    const approveId = e.target.getAttribute('data-approve');
    const rejectId = e.target.getAttribute('data-reject');
    if(approveId){
      const id = Number(approveId);
      let pending = read(STORAGE_KEYS.pending, []);
      const item = pending.find(x=>x.id===id);
      if(item){
        const tools = read(STORAGE_KEYS.tools, []);
        // ensure unique id when moving
        item.id = Date.now();
        tools.push(item);
        write(STORAGE_KEYS.tools, tools);
        pending = pending.filter(x=>x.id!==id);
        write(STORAGE_KEYS.pending, pending);
        alert('Approved and published!');
        location.reload();
      }
    }
    if(rejectId){
      const id = Number(rejectId);
      let pending = read(STORAGE_KEYS.pending, []);
      pending = pending.filter(x=>x.id!==id);
      write(STORAGE_KEYS.pending, pending);
      alert('Rejected.');
      location.reload();
    }
  });
}

// TOOL DETAIL + REVIEWS
function initTool(){
  const url = new URL(location.href);
  const id = Number(url.searchParams.get('id'));
  const tools = read(STORAGE_KEYS.tools, []);
  const tool = tools.find(t=>t.id===id);

  const detail = $('#toolDetail');
  const reviewsList = $('#reviewsList');
  const reviewForm = $('#reviewForm');

  if(!tool){
    detail.innerHTML = '<p>Tool not found.</p>';
    return;
  }

  function render(){
    detail.innerHTML = `
      <h2>${tool.name}</h2>
      <p class="muted">${tool.category} • ${calcAvgRating(tool)}★ • ${tool.users.toLocaleString()} users</p>
      <p>${tool.description}</p>
      <div style="margin:8px 0;">
        ${(tool.features||[]).map(f=>`<span class="badge" style="margin-right:6px">${f}</span>`).join('')}
      </div>
      <div class="row" style="margin-top:10px;">
        <div><span class="price">$${tool.price}</span>/month</div>
        <div>
          <a class="btn black" target="_blank" rel="noopener" href="${tool.affiliateUrl || '#'}">Subscribe Now</a>
        </div>
      </div>
    `;

    const reviews = (tool.reviews||[]).slice().sort((a,b)=> (b.helpful||0)-(a.helpful||0));
    reviewsList.innerHTML = reviews.length
      ? reviews.map(r => `
          <div class="tool-card">
            <div class="row">
              <strong>${r.userName}</strong>
              <span class="muted">${new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <p>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</p>
            <p>${r.text}</p>
            <button class="btn" data-helpful="${r.id}">Helpful (${r.helpful||0})</button>
          </div>
        `).join('')
      : '<p class="muted">No reviews yet. Be the first!</p>';
  }

  render();

  // mark helpful
  reviewsList.addEventListener('click',(e)=>{
    const idStr = e.target.getAttribute('data-helpful');
    if(!idStr) return;
    const rid = Number(idStr);
    const tools = read(STORAGE_KEYS.tools, []);
    const idx = tools.findIndex(t=>t.id===tool.id);
    if(idx>-1){
      const t = tools[idx];
      t.reviews = (t.reviews||[]).map(r => r.id===rid ? {...r, helpful:(r.helpful||0)+1} : r);
      write(STORAGE_KEYS.tools, tools);
      Object.assign(tool, t);
      render();
    }
  });

  // submit review
  reviewForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const user = currentUser();
    if(!user){ alert('Please sign in first.'); location.href='signup.html'; return; }

    const fd = new FormData(reviewForm);
    const rating = Number(fd.get('rating'));
    const text = fd.get('text').trim();
    if(!text){ alert('Please enter a review.'); return; }

    const tools = read(STORAGE_KEYS.tools, []);
    const idx = tools.findIndex(t=>t.id===tool.id);
    if(idx>-1){
      const t = tools[idx];
      t.reviews = t.reviews || [];
      t.reviews.push({
        id: Date.now(), userId: user.id, userName: user.name,
        rating, text, createdAt: nowISO(), helpful: 0
      });
      write(STORAGE_KEYS.tools, t);
      write(STORAGE_KEYS.tools, tools);
      Object.assign(tool, t);
      reviewForm.reset();
      render();
      alert('Review submitted!');
    }
  });
}
