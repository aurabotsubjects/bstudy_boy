/* ============================================================
   BOY: TALES OF CHILDHOOD — APP (redesigned "sweet-shop" edition)
   Content lives in boy-data.js; images in images.js.
   Views are HTML strings rendered into #app by render().
   All saved data (answers, rubric, Week 10 plan & checklist) uses the
   same browser storage keys as before, so nothing is lost.
   ============================================================ */

/* ============ STATE + ROUTER ============ */
let curWeek = 1;
const CW = () => WEEKS[curWeek].data;
const CQ = () => WEEKS[curWeek].quiz;
let state = {view:'landing', day:null};
let slideIdx = 0;
let slideDir = 0;
let sheetMode = 'onscreen';
let quizSubmitted = false;
let quizPrintMode = 'student';
let weekPackOpts = {lessonPlans:true, worksheets:true, quizStudent:true, quizAnswerKey:true};
const VIEWS = ['landing','weekhub','day','lessonplan','weekpack','rubric','rubricguide','teacherbook','quizprint','quizprintkey','workbook','readingplan','certificate'];

function hashFor(){
  if(state.view==='landing') return '#';
  const weekViews = ['weekhub','day','lessonplan','weekpack','quizprint','quizprintkey'];
  return '#' + state.view + (weekViews.includes(state.view) ? '/' + curWeek : '') + (state.day ? '/' + state.day : '');
}
function nav(view, day){
  state = {view, day: day||null}; slideIdx=0; slideDir=0; sheetMode='onscreen'; quizSubmitted=false;
  try{ history.pushState({view, day:state.day, week:curWeek}, '', hashFor() === '#' ? location.pathname + location.search : hashFor()); }catch(e){}
  if(['weekhub','day'].includes(view)) markVisited(curWeek);
  render(); window.scrollTo(0,0);
}
function openWeek(n){ curWeek = n; nav('weekhub'); }
function applyHash(){
  const p = location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(!p.length || !VIEWS.includes(p[0])){ state = {view:'landing', day:null}; return; }
  const view = p[0];
  let rest = p.slice(1);
  if(rest.length && /^\d+$/.test(rest[0]) && WEEKS[+rest[0]]){ curWeek = +rest[0]; rest = rest.slice(1); }
  state = {view, day: rest[0] || null};
  if(view==='day' && !state.day) state.view = 'weekhub';
}
window.addEventListener('popstate', ()=>{ applyHash(); slideIdx=0; slideDir=0; quizSubmitted=false; render(); });

function markVisited(n){
  try{
    const v = JSON.parse(localStorage.getItem('boyapp_visited')||'[]');
    if(!v.includes(n)){ v.push(n); localStorage.setItem('boyapp_visited', JSON.stringify(v)); }
    localStorage.setItem('boyapp_lastweek', String(n));
  }catch(e){}
}
function visitedWeeks(){ try{ return JSON.parse(localStorage.getItem('boyapp_visited')||'[]'); }catch(e){ return []; } }
function lastWeek(){ try{ return parseInt(localStorage.getItem('boyapp_lastweek')||'0',10); }catch(e){ return 0; } }

/* ============ SHARED CHROME ============ */
const HOME = `<button onclick="nav('landing')">Home</button>`;
const SEP = `<span>/</span>`;
const weekCrumb = () => `<button onclick="nav('weekhub')">Week ${curWeek}</button>`;
const here = (t) => `<span class="here">${t}</span>`;
const imgOr = (src, fallback, cls='') => src ? `<img src="${src}" alt="" class="${cls}">` : fallback;
const MODE_IMG = { teacher: typeof IMG_ICON_TEACHER!=='undefined' ? IMG_ICON_TEACHER : null, group: typeof IMG_ICON_GROUP!=='undefined' ? IMG_ICON_GROUP : null, quiz: typeof IMG_ICON_QUIZ!=='undefined' ? IMG_ICON_QUIZ : null };
const MODE_LABEL = { teacher:'Teacher read', group:'Group read', quiz:'Quiz day' };
const rCode = (id) => id.toUpperCase();
const weekImg = (n) => (typeof IMG_WEEKS!=='undefined' && IMG_WEEKS[n]) ? IMG_WEEKS[n] : IMG_HERO;

function topnav(crumb){
  const jump = Object.keys(WEEKS).map(n=>`<button class="${(+n===curWeek && state.view!=='landing')?'current':''}" style="background-image:url('${weekImg(n)}')" onclick="openWeek(${n})" title="Week ${n}: ${WEEK_THEMES[n-1].replace(/'/g,'&#39;')}"><span>${n}</span></button>`).join('');
  const crumbHTML = crumb.replace(/^Home(?=\s|$)/, HOME);
  return `<header class="topnav no-print"><div class="wrap topnav-inner">
    <button class="brand" onclick="nav('landing')"><img src="${IMG_FAVICON}" alt=""><span><b>Boy</b><small>Tales of Childhood · Book Study</small></span></button>
    <div class="crumbs">${crumbHTML}</div>
    <div class="nav-actions">
      <button class="nav-link ${state.view==='rubric'||state.view==='rubricguide'?'on':''}" onclick="nav('rubric')">📊 Rubric</button>
      <div class="week-jump" id="weekJump"><button class="btn cream small" onclick="event.stopPropagation();document.getElementById('weekJump').classList.toggle('open')">▦ Weeks</button><div class="week-jump-menu">${jump}</div></div>
    </div></div></header>`;
}
document.addEventListener('click', e=>{ const wj=document.getElementById('weekJump'); if(wj && !wj.contains(e.target)) wj.classList.remove('open'); });

function footerHTML(text){
  return `<footer class="no-print"><img src="${IMG_FAVICON}" alt=""><b>Boy: Tales of Childhood</b> · ${text||'a ten-week book study for Years 5–6 · NZ Curriculum English'}</footer>`;
}

function pageHead({bg, icon, small, title, text, actions}){
  return `<div class="page-head no-print reveal"><div class="bg" style="background-image:url('${bg}')"></div>
    ${icon || ''}<div class="ph-text"><small>${small}</small><h1>${title}</h1>${text?`<p>${text}</p>`:''}</div>
    ${actions?`<div class="toolbar">${actions}</div>`:''}</div>`;
}

function sweetConfetti(n=60){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c=document.createElement('div'); c.className='confetti';
  const cols=['#c8372d','#3f9e84','#e9a23b','#8a3030'];
  for(let i=0;i<n;i++){
    const s=document.createElement('i'); const z=12+Math.random()*18;
    s.style.cssText=`left:${Math.random()*100}%;width:${z}px;height:${z}px;--c:${cols[i%cols.length]};--dx:${(Math.random()-.5)*300}px;--r:${Math.random()*900-450}deg;animation-delay:${Math.random()*.8}s;animation-duration:${2.2+Math.random()*1.6}s`;
    c.appendChild(s);
  }
  document.body.appendChild(c); setTimeout(()=>c.remove(),4800);
}
function spawnSweets(){
  const layer=document.getElementById('sweetsLayer');
  if(!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const kinds=['','green','gold'];
  for(let i=0;i<9;i++){
    const s=document.createElement('span'); const z=18+Math.random()*26;
    s.className='mint-sweet '+kinds[i%3];
    s.style.cssText=`left:${Math.random()*100}%;width:${z}px;height:${z}px;animation-duration:${22+Math.random()*20}s;animation-delay:${-Math.random()*40}s`;
    layer.appendChild(s);
  }
}

/* ============ LANDING ============ */
function renderLanding(){
  const last = lastWeek();
  const visited = visitedWeeks();
  const qCount = Object.values(WEEKS).reduce((a,w)=>a+(w.quiz?w.quiz.length:0),0);
  const sweets = [['12%','18%',44,'var(--cherry)'],['40%','70%',30,'var(--mint)'],['78%','14%',56,'var(--butter)'],['88%','62%',34,'var(--cherry)'],['58%','28%',24,'var(--mint)']]
    .map(([l,t,s,c],i)=>`<span style="left:${l};top:${t};width:${s}px;height:${s}px;animation-delay:${-i*1.3}s;background:radial-gradient(circle,#fff 0 16%,transparent 18%),repeating-conic-gradient(${c} 0 30deg,#fff 30deg 60deg)"></span>`).join('');
  const jars = WEEK_THEMES.map((t,i)=>{
    const n=i+1;
    return `<button class="jar reveal" style="--d:${(i%5)*.06}s" onclick="openWeek(${n})">
      <div class="lid"></div><div class="thumb"><div style="background-image:url('${weekImg(n)}')"></div>${visited.includes(n)?'<span class="visited">✓ Visited</span>':''}</div>
      <span class="tag">No. ${n}</span>
      <div class="body"><h3>${t}</h3><div class="go">Open week <span>→</span></div></div></button>`;
  }).join('');
  const rhythm = [['teacher','Monday','Teacher read · slides'],['group','Tuesday','Group read · worksheet'],['teacher','Wednesday','Teacher read · slides'],['group','Thursday','Group read · worksheet'],['quiz','Friday','Quiz day · 20 questions']]
    .map(([m,d,t],i)=>`<div class="reveal" style="--d:${i*.07}s">${imgOr(MODE_IMG[m],'<span style="font-size:2rem">📖</span>')}<b>${d}</b><span>${t}</span></div>`).join('');
  return `
  ${topnav(here('Home'))}
  <section class="hero no-print">
    <div class="hero-bg" data-parallax></div>
    <div class="hero-sweets">${sweets}</div>
    ${typeof IMG_BADGE_BRAVE_READER!=='undefined' ? `<img class="hero-badge" src="${IMG_BADGE_BRAVE_READER}" alt="">` : ''}
    <div class="wrap hero-inner">
      <span class="eyebrow"><span class="dot"></span> A ten-week book study · Years 5–6</span>
      <h1><span class="h-boy">Boy</span><span class="h-sub">Tales of Childhood</span></h1>
      <p class="lede">Roald Dahl's memoir of sweet-shops, mischief, boarding school and courage. Every week brings a new chunk of the story, discussion questions, a project menu and a Friday quiz.</p>
      <div class="hero-ctas">
        ${last ? `<button class="btn big" onclick="openWeek(${last})">Continue Week ${last} →</button>` : `<button class="btn big" onclick="openWeek(1)">Start Week 1 →</button>`}
        <button class="btn glass big" onclick="nav('workbook')">📘 Student workbook</button>
        <button class="btn glass big" onclick="nav('teacherbook')">📗 Teacher book</button>
      </div>
    </div>
    <div class="scallop"></div>
  </section>
  <div class="wrap enter">
    <div class="stats reveal">
      <div><b>10</b><span>weeks</span></div><div><b>36</b><span>reading lessons</span></div>
      <div><b>${qCount}</b><span>quiz questions</span></div><div><b>${RUBRIC.length}</b><span>rubric criteria</span></div>
    </div>

    <div class="section-head"><div><div class="kicker">The term at a glance</div><h2>Ten weeks, one memoir</h2>
      <p>Pick a jar to open that week's slides, worksheets, quiz and project menu.</p></div>
      <button class="btn ghost small" onclick="nav('readingplan')">${PRINT_ICON_HTML} Term reading schedule</button></div>
    <div class="jars">${jars}</div>

    <div class="section-head"><div><div class="kicker">The weekly rhythm</div><h2>How every week works</h2>
      <p>The same routine each week, so everyone knows what's coming.</p></div></div>
    <div class="rhythm">${rhythm}</div>

    <div class="section-head"><div><div class="kicker">Teacher toolkit</div><h2>Print once, use all term</h2></div></div>
    <div class="toolkit">
      <button class="tool reveal" onclick="nav('workbook')">${imgOr(typeof IMG_ICON_JOURNAL!=='undefined'?IMG_ICON_JOURNAL:null,'<div class="emoji">📘</div>')}<b>Student workbook</b><span>Every page students write on for the whole term, with a cover.</span></button>
      <button class="tool reveal" style="--d:.05s" onclick="nav('teacherbook')">${imgOr(typeof IMG_ICON_PRINT!=='undefined'?IMG_ICON_PRINT:null,'<div class="emoji">📗</div>')}<b>Teacher book</b><span>Reading schedule, marking guide, every lesson plan and quiz answer key.</span></button>
      <button class="tool reveal" style="--d:.1s" onclick="nav('readingplan')"><div class="emoji">📅</div><b>Reading schedule</b><span>What is read each day, with start and stop points for split chapters.</span></button>
      <button class="tool reveal" style="--d:.15s" onclick="nav('rubric')">${imgOr(typeof IMG_ICON_QUIZ!=='undefined'?IMG_ICON_QUIZ:null,'<div class="emoji">📊</div>')}<b>Reading rubric</b><span>Track every student against the ${RUBRIC.length} whole-programme criteria.</span></button>
      <button class="tool reveal" style="--d:.2s" onclick="nav('rubricguide')"><div class="emoji">📋</div><b>Marking guide</b><span>What Not Achieved, Achieved and Excelled look like for each criterion.</span></button>
      <button class="tool reveal" style="--d:.25s" onclick="nav('certificate')">${imgOr(typeof IMG_BADGE_BRAVE_READER!=='undefined'?IMG_BADGE_BRAVE_READER:null,'<div class="emoji">🏅</div>')}<b>Certificate</b><span>A printable completion certificate for the celebration.</span></button>
    </div>
  </div>
  ${footerHTML()}`;
}

/* ============ WEEK HUB ============ */
function projectCardsHTML(list){
  return list.map((p,i)=>`<div class="proj reveal" style="--d:${i*.07}s"><div class="top">${projectIconHTML(p)}</div>
    <div class="num">Choice ${i+1}</div><h3>${p.title}</h3><p>${p.text}</p></div>`).join('');
}
function weekNavHTML(){
  const prev = curWeek>1 ? curWeek-1 : null, next = curWeek<10 ? curWeek+1 : null;
  return `<nav class="week-nav no-print">
    ${prev?`<button onclick="openWeek(${prev})"><div class="t" style="background-image:url('${weekImg(prev)}')"></div><div><small>← Week ${prev}</small><b>${WEEK_THEMES[prev-1]}</b></div></button>`:'<span></span>'}
    ${next?`<button class="next" onclick="openWeek(${next})"><div class="t" style="background-image:url('${weekImg(next)}')"></div><div><small>Week ${next} →</small><b>${WEEK_THEMES[next-1]}</b></div></button>`:''}
  </nav>`;
}
function renderWeekHub(){
  if(curWeek===10) return renderWeek10Hub();
  const w = CW();
  const reading = w.days.filter(d=>d.mode!=='quiz');
  const cards = w.days.map((d,i)=>`
    <button class="daycard ${d.mode} reveal" style="--d:${i*.08}s" onclick="nav('day','${d.key}')">
      <div class="icon">${imgOr(MODE_IMG[d.mode], d.icon)}</div>
      <div class="day">${d.label}</div><div class="mode">${MODE_LABEL[d.mode]}</div>
      <div class="chap">${d.chapter}</div>
      ${(d.rubricIds||[]).length?`<div class="codes">${d.rubricIds.map(id=>`<span class="code" title="${(RUBRIC.find(r=>r.id===id)||{}).code||''}">${rCode(id)}</span>`).join('')}</div>`:''}
    </button>`).join('');
  return `
  ${topnav(`Home${SEP}${here('Week '+curWeek)}`)}
  <section class="week-hero no-print">
    <div class="bg" data-parallax style="background-image:url('${weekImg(curWeek)}')"></div>
    <div class="big-num">${String(curWeek).padStart(2,'0')}</div>
    <div class="wrap">
      <span class="eyebrow"><span class="dot"></span> Week ${curWeek} of 10</span>
      <h1>${WEEK_THEMES[curWeek-1]}</h1>
      <div class="pills"><span class="pill">📖 ${reading[0].chapter.split(/ \(| →/)[0]} → ${reading[reading.length-1].chapter.split(' (')[0]}</span><span class="pill">📝 Friday quiz</span><span class="pill">🎨 ${w.projects.length} project choices</span></div>
    </div>
    <div class="scallop"></div>
  </section>
  <div class="wrap enter">
    <div class="signposts">
      <div class="signpost reveal">${imgOr(typeof IMG_ICON_LEADIN!=='undefined'?IMG_ICON_LEADIN:null,'')}<div class="lbl">Learning intention</div><p>${w.li}</p></div>
      <div class="signpost reveal" style="--d:.08s">${imgOr(MODE_IMG.quiz,'')}<div class="lbl">Success criteria</div><p>${w.sc}</p></div>
    </div>
    <div class="section-head"><div><div class="kicker">This week's trail</div><h2>Five days of reading</h2></div>
      <button class="btn small no-print" onclick="nav('weekpack')">${PRINT_ICON_HTML} Print week pack</button></div>
    <div class="trail">${cards}</div>

    <div class="section-head"><div><div class="kicker">Spare-time menu</div><h2>Weekly project choices</h2></div></div>
    <div class="tuckbox"><div class="proj-grid">${projectCardsHTML(w.projects)}</div></div>

    <div class="section-head no-print"><div><div class="kicker">For the teacher</div><h2>Print &amp; prepare</h2></div></div>
    <div class="action-row no-print">
      <button class="action-card reveal" onclick="nav('weekpack')">${imgOr(typeof IMG_ICON_PRINT!=='undefined'?IMG_ICON_PRINT:null,'🖨️')}<div><b>Week pack</b><span>Lesson plans, worksheets, quiz and answer key in one print job.</span></div></button>
      <button class="action-card reveal" style="--d:.05s" onclick="nav('quizprint','fri')">${imgOr(MODE_IMG.quiz,'📝')}<div><b>Quiz — student copy</b><span>The Friday quiz, ready to photocopy.</span></div></button>
      <button class="action-card reveal" style="--d:.1s" onclick="nav('rubric')">${imgOr(typeof IMG_BADGE_QUIZ_CHAMPION!=='undefined'?IMG_BADGE_QUIZ_CHAMPION:null,'📊')}<div><b>Reading rubric</b><span>Tick off this week's checkpoints: ${[...new Set(w.days.flatMap(d=>d.rubricIds||[]))].map(rCode).join(', ')}.</span></div></button>
    </div>
    ${weekNavHTML()}
  </div>
  ${footerHTML(`Week ${curWeek} of 10 · ${WEEK_THEMES[curWeek-1]}`)}`;
}

/* ============ DAY PAGES ============ */
function dayTabsHTML(){
  return `<div class="day-tabs no-print">${CW().days.map(d=>`<button class="day-tab ${d.mode} ${d.key===state.day?'active':''}" onclick="nav('day','${d.key}')">${imgOr(MODE_IMG[d.mode],`<span class="emo">${d.icon}</span>`)}<div><b>${d.label}</b><span>${MODE_LABEL[d.mode]}</span></div></button>`).join('')}</div>`;
}
function checkpointHTML(day){
  if(!(day.rubricIds||[]).length) return '';
  return `<div class="checkpoint no-print"><span class="cp-ic">📊</span><div style="flex:1;min-width:220px"><b>Rubric checkpoint</b> ${day.rubricIds.map(id=>`<span class="code">${rCode(id)}</span>`).join(' ')}<p>${day.rubricNote}</p></div><button class="btn butter small" onclick="nav('rubric')">Open rubric</button></div>`;
}
function dayShell(day, inner, extraActions){
  return `
  ${topnav(`Home${SEP}${weekCrumb()}${SEP}${here(day.label)}`)}
  <div class="wrap section enter">
    ${pageHead({bg:weekImg(curWeek), icon:imgOr(MODE_IMG[day.mode], `<span class="ph-emo">${day.icon}</span>`, 'ph-icon'),
      small:`Week ${curWeek} · ${day.label} · ${MODE_LABEL[day.mode]}`, title: day.mode==='quiz' ? `Week ${curWeek} Quiz` : day.chapter,
      text: day.mode==='quiz' ? `20 questions on ${WEEK_THEMES[curWeek-1]}` : (day.range || (day.mode==='teacher' ? 'Teacher reads aloud · slides for the class' : 'Groups read aloud in turns')),
      actions:`<button class="btn glass small" onclick="nav('lessonplan','${day.key}')">${PRINT_ICON_HTML} NZC lesson plan</button>${extraActions||''}`})}
    ${dayTabsHTML()}
    <div class="li-strip no-print"><div><b>Learning intention</b>${CW().li}</div><div><b>Success criteria</b>${CW().sc}</div></div>
    ${inner}
    ${checkpointHTML(day)}
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('weekhub')">← Back to Week ${curWeek}</button></div>
  </div>
  ${footerHTML(`Week ${curWeek} · ${day.label}`)}`;
}

function renderDay(key){
  if(curWeek===10) return renderWeek10Lesson(key);
  const day = CW().days.find(d=>d.key===key);
  if(!day){ state.view='weekhub'; return renderWeekHub(); }
  if(day.mode==='teacher') return renderTeacherSlides(day);
  if(day.mode==='group') return renderGroupWorksheet(day);
  return renderQuiz(day);
}

/* ---- Teacher-read slideshow ---- */
function buildSlides(day){
  const L = typeof IMG_ICON_LEADIN!=='undefined' ? `<img class="s-icon" src="${IMG_ICON_LEADIN}" alt="">` : '';
  const T = MODE_IMG.teacher ? `<img class="s-icon" src="${MODE_IMG.teacher}" alt="">` : '';
  const G = typeof IMG_ICON_GOAWAY!=='undefined' ? `<img class="s-icon" src="${IMG_ICON_GOAWAY}" alt="">` : '';
  return [
    {cls:'title', kicker:`Week ${curWeek} · ${day.label} · Now reading`, body:`<h2>${day.chapter}</h2><span class="range-pill">📖 ${day.range?day.range+' · ':''}mark the page numbers from your class set</span>`},
    {kicker:'Lead-in', body:`${L}<div class="s-kicker">Lead-in</div><h2>Before we start…</h2>${day.leadIn.map(q=>`<p>${q}</p>`).join('')}`},
    {kicker:'Reading time', body:`${T}<div class="s-kicker">Reading time</div><h2>${day.chapter}</h2><p>Read aloud now.</p><span class="range-pill">⏱️ Roughly 15–20 minutes</span>`},
    {kicker:'Comprehension & inference', body:`<div class="s-kicker">Comprehension &amp; inference</div><h2>Let's talk about it</h2><ol>${day.comp.map(q=>`<li>${q}</li>`).join('')}</ol>`},
    {kicker:'Go-away prompt', body:`${G}<div class="s-kicker">Go-away reflection</div><h2>Take it with you</h2><p>${day.goAway}</p><span class="range-pill">✏️ Record your answer in your reading journal</span>`}
  ];
}
function drawSlide(day){
  const slides = buildSlides(day);
  const card = document.getElementById('slideCard');
  if(!card) return render();
  const s = slides[slideIdx];
  card.className = 'slide-card ' + (s.cls||'');
  void card.offsetWidth;
  if(slideDir) card.classList.add(slideDir>0?'enter-next':'enter-prev');
  card.innerHTML = s.body;
  document.querySelectorAll('#sdots button').forEach((b,i)=>b.classList.toggle('on', i===slideIdx));
  document.getElementById('sProg').style.width = ((slideIdx+1)/slides.length*100)+'%';
  document.getElementById('sCount').textContent = `Slide ${slideIdx+1} of ${slides.length}`;
  document.getElementById('sPrev').disabled = slideIdx===0;
  document.getElementById('sNext').innerHTML = slideIdx===slides.length-1 ? 'Finish ✓' : 'Next →';
  document.getElementById('sBg').style.backgroundPosition = `${slideIdx/(slides.length-1)*100}% center`;
}
function goSlide(i){
  const day = CW().days.find(d=>d.key===state.day);
  const total = buildSlides(day).length;
  if(i>=total){ if(document.fullscreenElement) document.exitFullscreen(); nav('weekhub'); return; }
  i = Math.max(0, i);
  slideDir = i>slideIdx ? 1 : i<slideIdx ? -1 : 0;
  slideIdx = i; drawSlide(day);
}
function toggleFullscreen(){
  const st = document.getElementById('stage'); if(!st) return;
  if(document.fullscreenElement) document.exitFullscreen();
  else if(st.requestFullscreen) st.requestFullscreen();
  else if(st.webkitRequestFullscreen) st.webkitRequestFullscreen();
}
function renderTeacherSlides(day){
  const slides = buildSlides(day);
  const inner = `
    <div class="stage no-print" id="stage">
      <div class="sbg" id="sBg" style="background-image:url('${weekImg(curWeek)}')"></div>
      <div class="progress"><i id="sProg" style="width:${(slideIdx+1)/slides.length*100}%"></i></div>
      <div class="stage-top"><span class="pill" id="sCount">Slide ${slideIdx+1} of ${slides.length}</span><button class="btn glass small" onclick="toggleFullscreen()">⛶ Full screen</button></div>
      <div class="slide-area"><div class="slide-card ${slides[slideIdx].cls||''}" id="slideCard">${slides[slideIdx].body}</div></div>
      <div class="stage-nav">
        <button class="btn glass" id="sPrev" onclick="goSlide(slideIdx-1)" ${slideIdx===0?'disabled':''}>← Back</button>
        <div class="sdots" id="sdots">${slides.map((_,i)=>`<button class="${i===slideIdx?'on':''}" aria-label="Slide ${i+1}" onclick="goSlide(${i})"></button>`).join('')}</div>
        <button class="btn" id="sNext" onclick="goSlide(slideIdx+1)">${slideIdx===slides.length-1?'Finish ✓':'Next →'}</button>
      </div>
    </div>
    <p class="key-hint no-print">Use <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd> to move through the slides · <kbd>F</kbd> for full screen</p>`;
  return dayShell(day, inner);
}

/* ---- Group-read worksheet ---- */
function renderGroupWorksheet(day){
  const saved = loadAnswers(day);
  const onscreen = `
    <div class="worksheet reveal">
      <h3>${LEADIN_ICON_HTML}Lead-in — discuss as a group</h3>
      ${day.leadIn.map(q=>`<p style="font-weight:700;color:var(--choc)">${q}</p>`).join('')}
      <h3>🧠 Comprehension &amp; inference</h3>
      ${day.comp.map((q,i)=>`<div class="q"><label>${i+1}. ${q}</label><textarea id="comp${i}" rows="3" oninput="saveAnswers(CW().days.find(d=>d.key==='${day.key}'))" placeholder="Type your group's answer…">${saved.comp[i]||''}</textarea></div>`).join('')}
      <h3>${GOAWAY_ICON_HTML}Go-away reflection</h3>
      <div class="q"><label>${day.goAway}</label><textarea id="goaway" rows="3" oninput="saveAnswers(CW().days.find(d=>d.key==='${day.key}'))" placeholder="Type your answer…">${saved.go||''}</textarea></div>
      <div class="save-note" id="saveNote">✓ Answers save automatically to this device.</div>
    </div>`;
  const printable = `<button class="btn mint small print-only-btn" onclick="window.print()">${PRINT_ICON_HTML} Print this worksheet</button>${buildWorksheetPrintable(day)}`;
  const inner = `
    <div class="toggle no-print">
      <button class="${sheetMode==='onscreen'?'on':''}" onclick="sheetMode='onscreen';render()">🖥 On-screen</button>
      <button class="${sheetMode==='printable'?'on':''}" onclick="sheetMode='printable';render()">🖨 Printable PDF</button>
    </div>
    ${sheetMode==='onscreen' ? onscreen : printable}`;
  return dayShell(day, inner);
}

/* ---- Friday quiz ---- */
function renderQuiz(day){
  const quiz = CQ();
  const qs = quiz.map((q,i)=>{
    if(q.type==='mc'){
      const picked = quizSubmitted && window._quizPicks ? window._quizPicks[i] : undefined;
      const opts = q.opts.map((o,oi)=>`
        <label class="opt ${quizSubmitted && oi===q.a ? 'right' : ''}"><input type="radio" name="q${i}" value="${oi}" ${quizSubmitted?'disabled':''} ${picked===oi?'checked':''} onchange="quizProgress()"><span class="letter">${String.fromCharCode(65+oi)}</span><span>${o}</span></label>`).join('');
      const cls = quizSubmitted ? (picked===q.a ? 'correct answered' : 'incorrect' + (picked>=0?' answered':'')) : '';
      return `<div class="quiz-q ${cls}" id="qcard${i}"><div class="qb">${i+1}</div><div class="num">Question ${i+1} of ${quiz.length}</div><p class="qtext">${q.q}</p><div class="opts">${opts}</div></div>`;
    }
    return `<div class="quiz-q" id="qcard${i}"><div class="qb">${i+1}</div><div class="num">Question ${i+1} · short answer</div><p class="qtext">${q.q}</p>
      <textarea rows="2" id="short${i}" ${quizSubmitted?'disabled':''} oninput="quizProgress()" placeholder="Type your answer…"></textarea>
      <div style="margin-top:8px;"><button type="button" class="reveal-btn" onclick="document.getElementById('model${i}').classList.toggle('show')">Show model answer</button></div>
      <div class="model" id="model${i}">${q.model}</div></div>`;
  }).join('');
  const mcTotal = quiz.filter(q=>q.type==='mc').length;
  const earnedBadge = quizSubmitted && typeof IMG_BADGE_QUIZ_CHAMPION!=='undefined' && mcTotal>0 && (window._quizScore/mcTotal)>=0.8
    ? `<div class="badge-row"><img src="${IMG_BADGE_QUIZ_CHAMPION}" alt="Quiz champion badge"><span class="badge-text">Quiz champion! ${window._quizScore}/${mcTotal} — great reading this week.</span></div>` : '';
  const scoreBanner = quizSubmitted ? `<div class="score-banner" id="scoreBanner">Your score<span class="big">${window._quizScore} / ${mcTotal}</span>auto-marked questions · correct answers are shown in green below — check short answers against the model answers</div>${earnedBadge}` : '';
  const inner = `
    <div class="quiz-top no-print"><span class="count" id="qCount">0 / ${quiz.length}</span><span style="font-weight:800;color:var(--ink-soft)">answered</span><div class="bar"><i id="qBar" style="width:0"></i></div>
      <button class="btn ghost small" onclick="nav('quizprint','fri')">${PRINT_ICON_HTML} Student copy</button>
      <button class="btn ghost small" onclick="nav('quizprintkey','fri')">${PRINT_ICON_HTML} Answer key</button></div>
    ${scoreBanner}
    <div id="quizList">${qs}</div>
    <div style="text-align:center;margin-top:18px" class="no-print">${quizSubmitted
      ? `<button class="btn ghost big" onclick="quizSubmitted=false;render();window.scrollTo(0,0)">↺ Try again</button>`
      : `<button class="btn big" onclick="markQuiz()">✓ Submit quiz</button>`}</div>`;
  return dayShell(day, inner);
}
function quizProgress(){
  const quiz = CQ(); if(!quiz) return;
  let n = 0;
  quiz.forEach((q,i)=>{
    const card = document.getElementById('qcard'+i); if(!card) return;
    const done = q.type==='mc' ? !!document.querySelector(`input[name="q${i}"]:checked`) : !!(document.getElementById('short'+i)||{}).value?.trim();
    card.classList.toggle('answered', done); if(done) n++;
  });
  const c = document.getElementById('qCount'); if(c) c.textContent = `${n} / ${quiz.length}`;
  const b = document.getElementById('qBar'); if(b) b.style.width = (n/quiz.length*100)+'%';
}

/* ============ RUBRIC PAGE ============ */
function rubricCellHTML(level, meta){
  if(level===2) return `<span class="rmark excelled" title="Excelled${meta}">★</span>`;
  if(level===1) return `<span class="rmark achieved" title="Achieved${meta}">✓</span>`;
  return `<span class="rmark" title="Not achieved yet${meta}"></span>`;
}
function renderRubricPage(){
  const rows = RUBRIC.map(r=>{
    const cells = rubricData.students.map((s,si)=>{
      const key = si+'_'+r.id;
      const m = rubricData.marks[key];
      const level = m ? m.level : 0;
      const meta = m ? ' — '+m.date+' — click to cycle' : ' — click to mark';
      return `<td class="rubric-cell lvl${level}" onclick="toggleMark(${si},'${r.id}')">${rubricCellHTML(level, meta)}</td>`;
    }).join('');
    return `<tr><td class="rubric-crit"><span class="rcode">${rCode(r.id)} · ${r.code}</span><span class="rdesc">${r.text}</span><span class="rweeks">${r.weeks}</span></td>${cells}</tr>`;
  }).join('');
  const studentHeaders = rubricData.students.map((s,si)=>`<th>${s} <button class="rm-btn no-print" onclick="removeStudent(${si})" title="Remove student">✕</button></th>`).join('');
  return `
  ${topnav(`Home${SEP}${here('Reading Rubric')}`)}
  <div class="wrap section enter">
    ${pageHead({bg: typeof IMG_BG_TUCKBOX!=='undefined'?IMG_BG_TUCKBOX:IMG_HERO, icon: imgOr(MODE_IMG.quiz,'','ph-icon'), small:'Whole-programme tracking', title:'Reading Achievement Rubric',
      text:`One rubric for the whole ten-week study. Click a cell to cycle it: blank (Not Achieved) → ✓ Achieved → ★ Excelled.`,
      actions:`<button class="btn glass small" onclick="nav('rubricguide')">📋 Marking guide</button>`})}
    <div class="rubric-legend no-print"><span><span class="rmark"></span> Not achieved yet</span><span><span class="rmark achieved">✓</span> Achieved</span><span><span class="rmark excelled">★</span> Excelled</span></div>
    <div class="rubric-add no-print">
      <input id="newStudent" placeholder="Type a student's name and press Enter" onkeydown="if(event.key==='Enter')addStudent()">
      <button class="btn small" onclick="addStudent()">+ Add student</button>
      <button class="btn ghost small" onclick="window.print()">${PRINT_ICON_HTML} Print rubric</button>
      <button class="btn ghost small" onclick="nav('rubricguide')">📋 Marking guide</button>
    </div>
    <div class="rubric-scroll">
      <table class="rubric-table">
        <thead><tr><th>Criterion</th>${studentHeaders || '<th>Add students above to begin tracking</th>'}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="no-print" style="font-size:.86rem;color:var(--ink-soft);margin-top:14px;">Not sure whether something is Achieved or Excelled? The <button class="linklike" onclick="nav('rubricguide')">marking guide</button> gives examples of what each level could look like. Marks are saved on this device only. The same rubric, in kid-friendly language, is at the front of the Student Workbook.</p>
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('landing')">← Back to Home</button></div>
  </div>
  ${footerHTML('Reading Achievement Rubric · covers the whole programme')}`;
}

/* ============ WEEK 10 ============ */
function w10Icon(l){ return (l.key==='l3' && typeof IMG_ICON_PRESENTATION!=='undefined') ? `<img src="${IMG_ICON_PRESENTATION}" alt="">` : l.icon; }
function w10Shell(l, inner){
  return `
  ${topnav(`Home${SEP}<button onclick="nav('weekhub')">Week 10</button>${SEP}${here(l.label)}`)}
  <div class="wrap section enter">
    ${pageHead({bg: l.key==='l3' && typeof IMG_BANNER_FINAL_PROJECT!=='undefined' ? IMG_BANNER_FINAL_PROJECT : weekImg(10), icon: l.key==='l3' && typeof IMG_ICON_PRESENTATION!=='undefined' ? `<img class="ph-icon" src="${IMG_ICON_PRESENTATION}" alt="">` : `<span class="ph-emo">${l.icon}</span>`,
      small:`Week 10 · ${l.label}`, title:l.title, text:l.blurb})}
    <div class="day-tabs no-print">${WEEK10.lessons.map(x=>`<button class="day-tab ${x.key===l.key?'active':''}" onclick="nav('day','${x.key}')"><span class="emo">${x.icon}</span><div><b>${x.label}</b><span>${x.title}</span></div></button>`).join('')}</div>
    ${inner}
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('weekhub')">← Back to Week 10</button></div>
  </div>
  ${footerHTML('Week 10 · Final project & celebration')}`;
}
function renderWeek10Hub(){
  const w = WEEK10;
  const lessonCards = w.lessons.map((l,i)=>`
    <button class="daycard ${l.key==='l3'?'quiz':l.key==='l2'?'group':''} reveal" style="--d:${i*.08}s" onclick="nav('day','${l.key}')">
      <div class="icon">${w10Icon(l)}</div><div class="day">${l.label}</div><div class="mode">${l.title}</div><div class="chap">${l.blurb}</div>
    </button>`).join('');
  return `
  ${topnav(`Home${SEP}${here('Week 10')}`)}
  <section class="week-hero no-print">
    <div class="bg" data-parallax style="background-image:url('${weekImg(10)}')"></div>
    <div class="big-num">10</div>
    <div class="wrap">
      <span class="eyebrow"><span class="dot"></span> Week 10 of 10 · The finale</span>
      <h1>${WEEK_THEMES[9]}</h1>
      <div class="pills"><span class="pill">No new reading</span><span class="pill">3 lessons</span><span class="pill">Presentations</span><span class="pill">Certificates</span></div>
    </div>
    <div class="scallop"></div>
  </section>
  <div class="wrap enter">
    <div class="signposts">
      <div class="signpost reveal">${imgOr(typeof IMG_ICON_LEADIN!=='undefined'?IMG_ICON_LEADIN:null,'')}<div class="lbl">Learning intention</div><p>${w.li}</p></div>
      <div class="signpost reveal" style="--d:.08s">${imgOr(MODE_IMG.quiz,'')}<div class="lbl">Success criteria</div><p>${w.sc}</p></div>
    </div>
    <div class="section-head"><div><div class="kicker">Three lessons</div><h2>Choose, create, celebrate</h2><p>No new reading this week — three lessons to finish, present and celebrate the whole book study.</p></div></div>
    <div class="trail" style="grid-template-columns:repeat(3,1fr)">${lessonCards}</div>
    <div class="section-head"><div><div class="kicker">Choose one</div><h2>Final project options</h2></div></div>
    <div class="tuckbox"><div class="proj-grid">${projectCardsHTML(w.options)}</div></div>
    <div class="section-head"><div><div class="kicker">Rubric</div><h2>How this will be marked</h2><p>Marked against the same whole-programme rubric used all term — see the <button class="linklike" onclick="nav('rubric')">Reading Rubric</button>.</p></div></div>
    <ul class="rubric-list">${rubricListHTML(w.rubricIds)}</ul>
    <div class="lp-actions no-print" style="margin-top:22px"><button class="btn" onclick="nav('certificate')">${PRINT_ICON_HTML} Print completion certificate</button></div>
    ${weekNavHTML()}
  </div>
  ${footerHTML('Week 10 of 10 · Final project & celebration')}`;
}
function renderWeek10Lesson(key){
  const l = WEEK10.lessons.find(x=>x.key===key);
  if(!l){ state.view='weekhub'; return renderWeek10Hub(); }
  if(key==='l1') return renderWeek10L1(l);
  if(key==='l2') return renderWeek10L2(l);
  return renderWeek10L3(l);
}
function renderWeek10L1(l){
  let saved=''; try{ saved = localStorage.getItem('boyapp_w10_plan')||''; }catch(e){}
  return w10Shell(l, `
    <div class="section-head" style="margin-top:10px"><div><div class="kicker">Choose one</div><h2>Choose your final project</h2></div></div>
    <div class="tuckbox"><div class="proj-grid">${projectCardsHTML(WEEK10.options)}</div></div>
    <div class="section-head"><div><div class="kicker">Rubric</div><h2>How this will be marked</h2><p>Marked against the same whole-programme rubric used all term — see the <button class="linklike" onclick="nav('rubric')">Reading Rubric</button>.</p></div></div>
    <ul class="rubric-list">${rubricListHTML(WEEK10.rubricIds)}</ul>
    <div class="worksheet" style="margin-top:22px;">
      <h3>✏️ My project plan</h3>
      <div class="q"><label>Which option are you choosing, and what's your plan? (materials, roles if in a group, timeline)</label>
      <textarea id="w10plan" rows="5" oninput="saveWeek10Plan()">${saved}</textarea></div>
      <div class="save-note" id="w10PlanNote">✓ Answers save automatically to this device.</div>
    </div>`);
}
function renderWeek10L2(l){
  const data = loadW10Checklist();
  const done = WEEK10.checklist.filter((_,i)=>data[i]).length;
  const items = WEEK10.checklist.map((c,i)=>`
    <label class="check-item ${data[i]?'done':''}"><input type="checkbox" ${data[i]?'checked':''} onchange="toggleW10Check(${i})"><span>${c}</span></label>`).join('');
  return w10Shell(l, `
    <div class="worksheet">
      <h3>🛠️ Work time — progress checklist</h3>
      <div class="progress-line"><span>${done} of ${WEEK10.checklist.length} done</span><div class="bar"><i style="width:${done/WEEK10.checklist.length*100}%"></i></div></div>
      <div class="checklist">${items}</div>
      <div class="save-note">✓ Ticks save automatically to this device.</div>
    </div>`);
}
function renderWeek10L3(l){
  return w10Shell(l, `
    ${typeof IMG_BANNER_FINAL_PROJECT!=='undefined' ? `<div class="feature reveal no-print"><div class="fbg" style="background-image:url('${IMG_BANNER_FINAL_PROJECT}')"></div>
      <div class="fin">${typeof IMG_ICON_PRESENTATION!=='undefined'?`<img src="${IMG_ICON_PRESENTATION}" alt="">`:''}<div><small>Lesson 3</small><h3>Presentations &amp; celebration</h3><p>${l.blurb}</p></div></div></div>` : ''}
    <div class="lp">
      <div class="lp-row"><strong>Suggested running order:</strong>
        <ul>
          <li>Presentations or a gallery walk — each student/group shares their final project.</li>
          <li>Class discussion: What did we learn about resilience and courage from Roald Dahl's childhood? How has school discipline changed since the 1920s?</li>
          <li>Awarding of certificates.</li>
        </ul>
      </div>
    </div>
    <div class="lp-actions no-print"><button class="btn" onclick="nav('certificate')">${PRINT_ICON_HTML} Print completion certificates</button></div>`);
}

/* ---- Completion certificate ---- */
function certificateHTML(){
  const borderStyle = (typeof IMG_CERT_BORDER!=='undefined')
    ? ` style="background-image:url('${IMG_CERT_BORDER}'); background-size:100% 100%; background-repeat:no-repeat;"` : '';
  const braveReaderBadge = (typeof IMG_BADGE_BRAVE_READER!=='undefined')
    ? `<img src="${IMG_BADGE_BRAVE_READER}" alt="Brave Reader badge" style="width:100px;height:100px;object-fit:contain;margin:0 auto 6px;display:block;">` : '';
  return `<div class="certificate"${borderStyle}>
    <div class="cert-kicker">Boy: Tales of Childhood — Book Study</div>
    ${braveReaderBadge}
    <h2 class="cert-title">Certificate of Completion</h2>
    <p class="cert-line">This certifies that</p>
    <div class="cert-name">&nbsp;</div>
    <p class="cert-line">has read the whole of Roald Dahl's <i>Boy: Tales of Childhood</i>, completed all ten weeks of the book study, and shown resilience, courage and curiosity along the way.</p>
    <div class="cert-row"><span>Date: ____________________</span><span>Teacher's signature: ____________________</span></div>
  </div>`;
}
function renderCertificatePrint(){
  return `
  ${topnav(`Home${SEP}${here('Completion certificate')}`)}
  <div class="wrap section no-print enter">
    ${pageHead({bg: typeof IMG_BANNER_FINAL_PROJECT!=='undefined'?IMG_BANNER_FINAL_PROJECT:IMG_HERO, icon: imgOr(typeof IMG_BADGE_BRAVE_READER!=='undefined'?IMG_BADGE_BRAVE_READER:null,'','ph-icon'), small:'Printable', title:'Completion Certificate',
      text:'One blank certificate — print a copy per student, or use "multiple pages per sheet" in your print dialog to print several at once.'})}
    <div class="lp-actions"><button class="btn" onclick="window.print()">${PRINT_ICON_HTML} Print certificate</button><button class="btn ghost" onclick="nav('landing')">← Back to Home</button></div>
  </div>
  ${certificateHTML()}
  ${footerHTML('Completion certificate')}`;
}

/* ---- Whole-programme rubric storage (this device only) ---- */
function loadRubric(){
  try{ const raw = localStorage.getItem('boyapp_rubric'); return raw ? JSON.parse(raw) : {students:[], marks:{}}; }
  catch(e){ return {students:[], marks:{}}; }
}
function saveRubric(){ try{ localStorage.setItem('boyapp_rubric', JSON.stringify(rubricData)); }catch(e){} }
let rubricData = loadRubric();
function addStudent(){
  const inp = document.getElementById('newStudent');
  const name = inp.value.trim();
  if(!name) return;
  rubricData.students.push(name); saveRubric(); inp.value=''; render();
}
function removeStudent(i){ rubricData.students.splice(i,1); saveRubric(); render(); }
/* Tri-state click cycle: blank (Not Achieved) -> 1 (Achieved) -> 2 (Excelled) -> blank */
function toggleMark(si, rid){
  const key = si+'_'+rid;
  const cur = rubricData.marks[key];
  const level = cur ? cur.level : 0;
  if(level>=2) delete rubricData.marks[key];
  else rubricData.marks[key] = {level:level+1, date:new Date().toISOString().slice(0,10)};
  saveRubric(); render();
}

/* Week banner artwork (IMG_WEEKS lives in images.js; weeks without artwork simply show no banner). */
const WEEK_BANNER_ALT = {
  1:'An old-fashioned sweet-shop window filled with glass jars of colourful boiled sweets',
  2:'A tiny grey mouse peeking out from behind a giant glass sweet jar',
  3:'A wooden rowing boat on a calm Norwegian fjord at sunset',
  4:'An open tuck-box full of sweets on a quay, with a paddle-steamer crossing the water behind',
  5:'A vintage open-top motor-car driving down an autumn country lane',
  6:'An empty old classroom with wooden desks and inkwells in golden afternoon light',
  7:'A pipe resting on sunny seaside rocks beside a small pile of goat droppings, with a curious goat, a fjord and a red wooden house behind',
  8:'An open grey box of twelve numbered, wrapped chocolate bars on a desk beside old books, with a school building through the window',
  9:'A vintage motorbike with goggles on the handlebars parked by an old school gate at sunset among autumn leaves',
  10:'A school hall with student artwork on the wall, easels, flowers and colourful bunting in golden light'
};
function weekBannerHTML(n){
  if(typeof IMG_WEEKS==='undefined' || !IMG_WEEKS[n]) return '';
  return `<div class="week-banner"><img src="${IMG_WEEKS[n]}" alt="${WEEK_BANNER_ALT[n]||''}"></div>`;
}

/* Shared inline icon for every print button (unit plan Section 8C, prompt 21). Falls back to the emoji if images.js hasn't loaded. */
const PRINT_ICON_HTML = (typeof IMG_ICON_PRINT!=='undefined') ? `<img src="${IMG_ICON_PRINT}" alt="" class="btn-icon">` : '🖨️';
/* Lead-in and go-away icons (prompts 22–23), used next to those headings in the on-screen slideshow and group worksheet. */
const LEADIN_ICON_HTML = (typeof IMG_ICON_LEADIN!=='undefined') ? `<img src="${IMG_ICON_LEADIN}" alt="" class="inline-icon">` : '💡';
const GOAWAY_ICON_HTML = (typeof IMG_ICON_GOAWAY!=='undefined') ? `<img src="${IMG_ICON_GOAWAY}" alt="" class="inline-icon">` : '👣';

/* Weekly project icons: Poster / Comic strip / Drama scene / Journal reflection use artwork from images.js; other projects keep their emoji. */
function projectIconHTML(p){
  const art = {
    'Poster': typeof IMG_ICON_POSTER!=='undefined' ? IMG_ICON_POSTER : null,
    'Comic strip': typeof IMG_ICON_COMIC!=='undefined' ? IMG_ICON_COMIC : null,
    'Drama scene': typeof IMG_ICON_DRAMA!=='undefined' ? IMG_ICON_DRAMA : null,
    'Journal reflection': typeof IMG_ICON_JOURNAL!=='undefined' ? IMG_ICON_JOURNAL : null
  }[p.title];
  return art ? `<img src="${art}" alt="">` : p.icon;
}

/* ---- Printable NZC-aligned lesson plan (shared by day view + week pack) ---- */
function lessonPlanHTML(day){
  const timing = day.mode==='quiz'
    ? [['Quiz — 20 questions','35 min'],['Review answers together / reflection','10 min']]
    : [['Settle & lead-in questions','5 min'],['Reading','15–20 min'],['Comprehension & inference','15 min'],['Go-away reflection','5 min']];
  const rubricBits = (day.rubricIds||[]).map(id=>RUBRIC.find(r=>r.id===id)).filter(Boolean);
  return `
    <div class="lp">
      <div class="lp-head">
        <h3>Boy: Tales of Childhood — Lesson Plan</h3>
        <p class="lp-meta">Week ${curWeek} · ${day.label} · ${day.chapter} · Years 5–6, NZC English Level 3–4</p>
      </div>
      <div class="lp-row"><strong>Learning Intention:</strong> ${CW().li}</div>
      <div class="lp-row"><strong>Success Criteria:</strong> ${CW().sc}</div>
      <div class="lp-row"><strong>NZC alignment:</strong>
        <ul>${NZC_LINES.map(l=>`<li>${l}</li>`).join('')}</ul>
      </div>
      <div class="lp-row"><strong>Timing (${day.mode==='quiz'?'45 min lesson':'45 min lesson'}):</strong>
        <table class="lp-timing">${timing.map(([l,m])=>`<tr><td>${l}</td><td>${m}</td></tr>`).join('')}</table>
      </div>
      ${day.leadIn ? `<div class="lp-row"><strong>Lead-in:</strong><ul>${day.leadIn.map(q=>`<li>${q}</li>`).join('')}</ul></div>` : ''}
      ${day.comp ? `<div class="lp-row"><strong>Comprehension &amp; inference:</strong><ul>${day.comp.map(q=>`<li>${q}</li>`).join('')}</ul></div>` : ''}
      ${day.goAway ? `<div class="lp-row"><strong>Go-away reflection prompt:</strong> ${day.goAway}</div>` : ''}
      ${rubricBits.length ? `<div class="lp-row lp-rubric-note"><strong>📊 Rubric checkpoint:</strong> ${day.rubricNote}
        <div>${rubricBits.map(r=>`<span class="rtag">${r.code}</span>`).join('')}</div></div>` : ''}
    </div>
  `;
}

/* ---- Group-read worksheet ---- */
function wsStorageKey(day){ return 'boyapp_w'+curWeek+'_'+day.key; }
function loadAnswers(day){
  try{
    const raw = localStorage.getItem(wsStorageKey(day));
    return raw ? JSON.parse(raw) : {comp:day.comp.map(()=>''), go:''};
  }catch(e){ return {comp:day.comp.map(()=>''), go:''}; }
}
function saveAnswers(day){
  try{
    const ans = {
      comp: day.comp.map((_,i)=>document.getElementById('comp'+i).value),
      go: document.getElementById('goaway').value
    };
    localStorage.setItem(wsStorageKey(day), JSON.stringify(ans));
    const n = document.getElementById('saveNote'); if(n) n.textContent = 'Saved ✓ (kept on this device only)';
  }catch(e){}
}
function buildWorksheetPrintable(day){
  return `
    <div class="worksheet">
      <h3>${day.chapter} — Reading Worksheet</h3>
      <p style="font-size:.85rem;color:var(--ink-soft);">Name(s): ____________________________</p>
      <h3>Lead-in</h3>
      ${day.leadIn.map(q=>`<p>${q}</p><div class="print-lines"></div>`).join('')}
      <h3>Comprehension &amp; inference</h3>
      ${day.comp.map((q,i)=>`<p>${i+1}. ${q}</p><div class="print-lines"></div><div class="print-lines"></div>`).join('')}
      <h3>Go-away reflection</h3>
      <p>${day.goAway}</p><div class="print-lines"></div><div class="print-lines"></div>
    </div>`;
}

/* ---- Friday quiz: printable (student copy or teacher answer key) ---- */
function buildQuizPrintable(withAnswers){
  const qs = CQ().map((q,i)=>{
    if(q.type==='mc'){
      const opts = q.opts.map((o,oi)=>`<div class="print-opt">${String.fromCharCode(97+oi)}) ${o}${withAnswers && oi===q.a ? ' ✓ (correct)':''}</div>`).join('');
      return `<div class="pq"><p><strong>${i+1}.</strong> ${q.q}</p>${opts}</div>`;
    }
    return `<div class="pq"><p><strong>${i+1}.</strong> ${q.q}</p><div class="print-lines"></div><div class="print-lines"></div>${withAnswers?`<p style="font-size:.85rem;color:var(--fjord);font-style:italic;"><em>Model answer:</em> ${q.model}</p>`:''}</div>`;
  }).join('');
  return `<div class="worksheet"><h3>Week ${curWeek} Quiz — ${withAnswers?'Teacher Answer Key':'Student Copy'}</h3>${withAnswers?'':'<p style="font-size:.85rem;color:var(--ink-soft);">Name: ____________________________</p>'}${qs}</div>`;
}
function renderQuizPrintPage(withAnswers){
  return `
  ${topnav(`Home / <button onclick="nav('weekhub')">Week ${curWeek}</button> / Friday Quiz Print`)}
  <div class="wrap section">
    <div class="section-head"><div class="kicker">PRINTABLE</div><h2>Week ${curWeek} Quiz — ${withAnswers?'Answer Key':'Student Copy'}</h2></div>
    <button class="btn ghost small print-only-btn" onclick="window.print()">${PRINT_ICON_HTML} Print this</button>
    ${buildQuizPrintable(withAnswers)}
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('day','fri')">← Back to Quiz</button></div>
  </div>
  `;
}


function markQuiz(){
  let score = 0; window._quizPicks = {};
  CQ().forEach((q,i)=>{
    if(q.type!=='mc') return;
    const picked = document.querySelector(`input[name="q${i}"]:checked`);
    const val = picked ? parseInt(picked.value) : -1;
    window._quizPicks[i] = val;
    const card = document.getElementById('qcard'+i);
    if(val===q.a){ score++; card.classList.add('correct'); }
    else { card.classList.add('incorrect'); }
  });
  window._quizScore = score;
  quizSubmitted = true;
  render();
  const sb = document.getElementById('scoreBanner');
  if(sb) sb.scrollIntoView({behavior:'smooth', block:'center'}); else window.scrollTo(0,0);
  const mc = CQ().filter(q=>q.type==='mc').length;
  if(mc && score/mc >= 0.5) sweetConfetti();
}

/* ---- Standalone printable NZC lesson plan page ---- */
function renderLessonPlanView(key){
  const day = CW().days.find(d=>d.key===key);
  return `
  ${topnav(`Home / <button onclick="nav('weekhub')">Week ${curWeek}</button> / ${day.label} Lesson Plan`)}
  <div class="wrap section">
    <div class="section-head"><div class="kicker">PRINTABLE</div><h2>${day.label} — NZC Lesson Plan</h2></div>
    <button class="btn ghost small print-only-btn" onclick="window.print()">${PRINT_ICON_HTML} Print this lesson plan</button>
    ${lessonPlanHTML(day)}
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('day','${day.key}')">← Back to ${day.label}</button></div>
  </div>
  `;
}

/* ---- Week Pack: one print job with lesson plans + worksheets + quiz ---- */
function renderWeekPack(){
  const opts = weekPackOpts;
  const sections = CW().days.map(day=>{
    let block = `<div class="wp-day-title">${day.label} — ${day.chapter}</div>`;
    if(opts.lessonPlans) block += lessonPlanHTML(day);
    if(opts.worksheets && day.mode==='group') block += buildWorksheetPrintable(day);
    if(day.mode==='quiz' && opts.quizStudent) block += buildQuizPrintable(false);
    return `<div class="wp-section">${block}</div>`;
  }).join('');
  const answerKey = opts.quizAnswerKey
    ? `<div class="wp-section"><div class="wp-day-title">Teacher-only: Quiz Answer Key</div>${buildQuizPrintable(true)}</div>`
    : '';

  return `
  ${topnav(`Home / <button onclick="nav('weekhub')">Week ${curWeek}</button> / Week Pack`)}
  <div class="wrap section">
    <div class="section-head"><div class="kicker">ONE-CLICK PREP</div><h2>Week ${curWeek} — Print Pack</h2></div>
    <p style="color:var(--ink-soft);max-width:640px;">Everything for this week's prep in one print job: NZC-aligned lesson plans, worksheets and the quiz. Tick what you need, then print — choose "Save as PDF" in the print dialog for a single PDF file.</p>
    <div class="wp-opts no-print">
      <label><input type="checkbox" ${opts.lessonPlans?'checked':''} onchange="weekPackOpts.lessonPlans=this.checked;render()"> Lesson plans</label>
      <label><input type="checkbox" ${opts.worksheets?'checked':''} onchange="weekPackOpts.worksheets=this.checked;render()"> Group-read worksheets</label>
      <label><input type="checkbox" ${opts.quizStudent?'checked':''} onchange="weekPackOpts.quizStudent=this.checked;render()"> Friday quiz (student copy)</label>
      <label><input type="checkbox" ${opts.quizAnswerKey?'checked':''} onchange="weekPackOpts.quizAnswerKey=this.checked;render()"> Quiz answer key (teacher only)</label>
      <button class="btn small" onclick="window.print()">${PRINT_ICON_HTML} Print week pack</button>
    </div>
    <div class="wp-cover">
      <h3>Boy: Tales of Childhood — Week ${curWeek} Pack</h3>
      <p>${WEEK_THEMES[curWeek-1]} · Years 5–6, NZC English Level 3–4</p>
    </div>
    ${sections}
    ${answerKey}
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('weekhub')">← Back to Week ${curWeek}</button></div>
  </div>
  `;
}

/* ---- Printable teacher marking guide: level descriptors instead of tick boxes, to support consistent judgement ---- */
function rubricGuideHTML(){
  const rows = RUBRIC.map(r=>`<tr>
    <td class="rubric-crit"><span class="rcode">${r.code}</span><span class="rdesc">${r.text}</span></td>
    <td>${r.notYet}</td>
    <td>${r.achieved}</td>
    <td>${r.excelled}</td>
  </tr>`).join('');
  return `<div class="rubric-scroll"><table class="rubric-table rubric-guide">
    <thead><tr><th>Criterion</th><th>Not achieved might look like…</th><th>Achieved might look like…</th><th>Excelled might look like…</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}
function renderRubricGuide(){
  return `
  ${topnav(`Home / <button onclick="nav('rubric')">Reading Rubric</button> / Marking guide`)}
  <div class="wrap section">
    <div class="section-head"><div class="kicker">TEACHER SUPPORT</div><h2>Rubric Marking Guide</h2></div>
    <p style="color:var(--ink-soft);max-width:680px;">Use this alongside the interactive rubric to decide what to tick. These are examples of what each level could look like, not an exhaustive checklist — trust your professional judgement. The same table is included in the Teacher Book.</p>
    <button class="btn ghost small print-only-btn" onclick="window.print()">${PRINT_ICON_HTML} Print this guide</button>
    ${rubricGuideHTML()}
    <div class="back-row no-print"><button class="btn ghost" onclick="nav('rubric')">← Back to Rubric</button></div>
  </div>
  <footer>Rubric Marking Guide · Boy: Tales of Childhood programme</footer>
  `;
}

function saveWeek10Plan(){
  try{
    localStorage.setItem('boyapp_w10_plan', document.getElementById('w10plan').value);
    const n = document.getElementById('w10PlanNote'); if(n) n.textContent = 'Saved ✓ (kept on this device only)';
  }catch(e){}
}
function loadW10Checklist(){ try{ const raw=localStorage.getItem('boyapp_w10_checklist'); return raw?JSON.parse(raw):{}; }catch(e){ return {}; } }
function toggleW10Check(i){
  const data = loadW10Checklist();
  data[i] = !data[i];
  try{ localStorage.setItem('boyapp_w10_checklist', JSON.stringify(data)); }catch(e){}
  render();
}

/* ============ STUDENT WORKBOOK (printable booklet) ============ */
/* Every week registered in WEEKS flows into the booklet automatically. */
function wbWeeks(){ return Object.keys(WEEKS).map(n=>({n:+n, theme:WEEK_THEMES[n-1], data:WEEKS[n].data, quiz:WEEKS[n].quiz})); }
const wbLn = n => '<div class="wb-ln"></div>'.repeat(n);

/* ---- Term reading schedule (whole term; page numbers left blank because editions differ) ---- */
/* who: T = teacher read, G = group read. Weeks appear in order; Week 10 has no new reading. */
const READING_PLAN = [
 [['T','Starting-point → Papa and Mama'],['G','Kindergarten, 1922–3'],['T','The bicycle and the sweet-shop','Part 1: to the end of the backpedalling-bicycle memory'],['G','The bicycle and the sweet-shop','Part 2: Thwaites, the sweets, and Mrs Pratchett']],
 [['T','The Great Mouse Plot'],['G','Mr Coombes','Part 1: the closed shop → arriving at prayers'],['T','Mr Coombes','Part 2: the playground line-up → Mrs Pratchett identifies the five boys'],['G',"Mrs Pratchett's revenge",'Part 1: the study → all five boys have been caned']],
 [['T',"Mrs Pratchett's revenge",'Part 2: bathtime discovery → the decision to change schools'],['G','Going to Norway'],['T','The magic island','Part 1: arrival at Tjöme → the description of breakfast'],['G','The magic island','Part 2: the boats → fishing in the evenings']],
 [['T','A visit to the doctor'],['G','First day'],['T','Writing home'],['G','The Matron','Part 1: introduction of the Matron → the sugar-on-the-corridor prank and its punishment']],
 [['T','The Matron','Part 2: chamber pots and dormitory rules → the Tweedie soap-flakes incident'],['G','Homesickness'],['T','A drive in the motor-car','Part 1: the new car → the crash'],['G','A drive in the motor-car','Part 2: the egg-seller → waking up with the sovereign']],
 [['T','Captain Hardcastle','Part 1: his introduction and appearance → the strict rules of Prep'],['T','Captain Hardcastle','Part 2: the rules of Prep in action, including the Braithwaite/wasp dialogue → the broken pen nib'],['G','Captain Hardcastle','Part 3: Roald whispers to Dobson → receiving the Stripe and the meeting with the Headmaster'],['G','Captain Hardcastle',"Part 4: the punishment → Highton's offer to write to his father"]],
 [['T','Little Ellis and the boil'],['G',"Goat's tobacco"],['T','Getting dressed for the big school'],['G','Boazers']],
 [['T','The Headmaster'],['G','Chocolates'],['T','Corkers'],['G','Fagging']],
 [['T','Games and photography'],['G','Goodbye school','Part 1: choosing a career instead of university → getting the job at Shell'],['T','Goodbye school','Part 2: leaving Repton on the motorbike → the Newfoundland expedition and Shell training'],['G','Goodbye school','Part 3: the posting to Egypt or East Africa → leaving for Africa']]
];
[WEEK1,WEEK2,WEEK3].forEach((w,wi)=>w.days.forEach((d,i)=>{ const r=READING_PLAN[wi][i]; if(r&&r[2]) d.range=r[2]; }));
function readingRows(from,to){
  const DAYS=['Mon','Tue','Wed','Thu'];
  let h='';
  for(let i=from;i<to;i++){
    if(i===9){
      h+=`<tr class="wk"><td colspan="5">Week 10 · Final project &amp; celebration</td></tr><tr><td colspan="5">No new reading this week — time to finish, present and celebrate.</td></tr>`;
      continue;
    }
    h+=`<tr class="wk"><td colspan="5">Week ${i+1} · ${WEEK_THEMES[i]}<span>Friday: quiz</span></td></tr>`;
    h+=READING_PLAN[i].map((r,di)=>`<tr><td class="d">${DAYS[di]}</td><td><b>${r[1]}</b>${r[2]?`<small>${r[2]}</small>`:''}</td><td class="by">${r[0]==='T'?'📖 Teacher':'👥 Group'}</td><td class="pp">pp. ____ – ____</td><td class="ok">☐</td></tr>`).join('');
  }
  return h;
}
function wbSchedule(){
  const head=`<thead><tr><th>Day</th><th>What we read</th><th>Read by</th><th>Pages</th><th>Done</th></tr></thead>`;
  return `<section class="wb-sec"><div class="wb-kick">READING SCHEDULE</div><h2>What we read each day</h2>
    <p style="font-size:.85rem;">Chapters are from <i>Boy</i>. Where a chapter is split, "Part" tells you where to start and stop. Write the page numbers from your own copy, then tick each day when it's read. Every Friday is quiz day.</p>
    <table class="rs">${head}${readingRows(0,5)}</table></section>
  <section class="wb-sec"><div class="wb-kick">READING SCHEDULE (CONTINUED)</div>
    <table class="rs">${head}${readingRows(5,10)}</table></section>`;
}
function renderReadingPlan(){
  return `
  ${topnav('Home / Reading schedule')}
  <div class="wrap section no-print">
    <div class="section-head"><div class="kicker">PRINTABLE</div><h2>Term Reading Schedule</h2></div>
    <p style="color:var(--ink-soft);max-width:640px;">What is read on each day for the whole term, with the start and stop points for split chapters. Page numbers are left blank so they can be filled in from your class copies.</p>
    <div class="lp-actions"><button class="btn" onclick="window.print()">${PRINT_ICON_HTML} Print reading schedule</button><button class="btn ghost" onclick="nav('landing')">← Back to Home</button></div>
  </div>
  <div class="wb-doc">${wbSchedule()}</div>`;
}

function wbCover(){
  return `<section class="wb-sec wb-cover"><img src="${IMG_WB_COVER}" alt="Boy: Tales of Childhood — Student Workbook cover">
    <div class="wb-title"><b>BOY</b><i>Tales of Childhood</i><span>Student Workbook</span></div>
    <div class="wb-name">Name</div></section>`;
}
/* ---- Student self-check page for the ONE whole-programme rubric (kid-language, tri-state tick boxes) ---- */
function wbRubricPage(){
  const rows = RUBRIC.map(r=>`<tr><td class="wb-rcrit"><b>${r.code}</b><br>${r.short}</td><td class="wb-rtick">☐</td><td class="wb-rtick">☐</td><td class="wb-rtick">☐</td></tr>`).join('');
  return `<section class="wb-sec"><div class="wb-kick">MY READING RUBRIC</div><h2>My Reading Achievement Rubric</h2>
    <p style="font-size:.85rem;">This is the ONE rubric for the whole book study — it doesn't change from week to week. Your teacher will tell you when to tick a box for each one, usually during a lesson or straight after a quiz.</p>
    <table class="rs wb-rubric-table"><thead><tr><th>What I can do</th><th>Not yet</th><th>Achieved</th><th>Excelled</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}
function wbWelcome(weeks){
  return `<section class="wb-sec"><div class="wb-kick">WELCOME</div><h2>Your Boy workbook</h2>
    <p>This is your reading journal for the whole book study. Keep it safe — you will write in it all term.</p>
    <h3>How it works</h3>
    <p>• Every reading day has three parts: <b>Lead-in</b>, <b>Comprehension &amp; inference</b> and a <b>Go-away reflection</b>.<br>
    • Friday is quiz day.<br>
    • Each week there is a spare-time project menu — pick one and plan it here.</p>
    <h3>What's inside</h3>
    <p><b>My Reading Achievement Rubric</b> — the one rubric for the whole term</p>
    <p><b>Reading schedule</b> — every day of the term</p>
    ${weeks.map(w=>`<p><b>Week ${w.n}</b> — ${w.theme}</p>`).join('')}
    <h3>This workbook belongs to</h3>${wbLn(1)}<p style="font-size:.8rem;color:#6b5e4a;">Class</p>${wbLn(1)}
  </section>`;
}
function wbOpener(w){
  const scs = w.data.sc.split(/;\s*/).map(s=>s.replace(/\.$/,''));
  const projects = w.data.projects.map(p=>`<div><b>☐ ${p.icon} ${p.title}</b>${p.text}</div>`).join('');
  return `<section class="wb-sec"><div class="wb-kick">WEEK ${w.n}</div><h2>${w.theme}</h2>
    <div class="wb-box"><b>LEARNING INTENTION</b><p>${w.data.li}</p></div>
    <div class="wb-box"><b>SUCCESS CRITERIA — tick how you went at the end of the week</b>
      ${scs.map(s=>`<p>${s}.</p><div class="wb-check"><span>☐ Not yet</span><span>☐ Getting there</span><span>☐ Got it!</span></div>`).join('')}</div>
    <h3>Spare-time project menu — tick the one you choose</h3><div class="wb-proj">${projects}</div>
    <h3>My project plan</h3>${wbLn(5)}
  </section>`;
}
function wbDay(w,d){
  return `<section class="wb-sec"><div class="wb-kick">WEEK ${w.n} · ${d.label.toUpperCase()} · ${d.mode==='group'?'GROUP READ':'TEACHER READ'}</div>
    <h2>${d.chapter}</h2>
    <h3>Lead-in</h3>${d.leadIn.map(q=>`<p>${q}</p>${wbLn(3)}`).join('')}
    <h3>Comprehension &amp; inference</h3>${d.comp.map((q,i)=>`<p><b>${i+1}.</b> ${q}</p>${wbLn(3)}`).join('')}
    <h3>Go-away reflection</h3><p>${d.goAway}</p>${wbLn(6)}
  </section>`;
}
function wbQuiz(w){
  const qs = w.quiz.map((q,i)=>{
    const body = q.type==='mc'
      ? q.opts.map((o,oi)=>`<div class="wb-opt">○ ${String.fromCharCode(97+oi)}) ${o}</div>`).join('')
      : wbLn(2);
    return `<div class="wb-q"><p><b>${i+1}.</b> ${q.q}</p>${body}</div>`;
  }).join('');
  return `<section class="wb-sec"><div class="wb-kick">WEEK ${w.n} · FRIDAY</div><h2>Week ${w.n} Quiz</h2>
    <p style="font-size:.85rem;">Name: ______________________________ &nbsp; Date: ______________</p>${qs}</section>`;
}
function wbWeek10Pages(w){
  const optionsHtml = w.data.options.map(p=>`<div><b>☐ ${p.icon} ${p.title}</b>${p.text}</div>`).join('');
  const rubricHtml = `<p style="font-size:.85rem;">Marked against your one Reading Achievement Rubric (see the front of this workbook) — especially:</p>` + rubricListP(w.data.rubricIds);
  const checklistHtml = w.data.checklist.map(c=>`<p>☐ ${c}</p>`).join('');
  const brief = `<section class="wb-sec"><div class="wb-kick">WEEK 10</div><h2>${w.theme}</h2>
    <div class="wb-box"><b>LEARNING INTENTION</b><p>${w.data.li}</p></div>
    <div class="wb-box"><b>SUCCESS CRITERIA</b><p>${w.data.sc}</p></div>
    <h3>Choose your final project</h3><div class="wb-proj">${optionsHtml}</div>
    <h3>How this will be marked</h3>${rubricHtml}
    <h3>My project plan</h3>${wbLn(5)}
  </section>`;
  const tracker = `<section class="wb-sec"><div class="wb-kick">WEEK 10 · LESSON 2</div><h2>Work time — progress checklist</h2>
    ${checklistHtml}
    <h3>Notes to myself</h3>${wbLn(6)}
  </section>`;
  const presentation = `<section class="wb-sec"><div class="wb-kick">WEEK 10 · LESSON 3</div><h2>Presentations &amp; celebration</h2>
    <p>Use this space to plan what you will say when you present your final project.</p>${wbLn(8)}
  </section>`;
  return brief + tracker + presentation;
}
function wbBook(){
  const weeks = wbWeeks();
  const parts = weeks.map(w=> w.n===10
    ? wbWeek10Pages(w)
    : [wbOpener(w)].concat(w.data.days.map(d=> d.mode==='quiz' ? wbQuiz(w) : wbDay(w,d))).join(''));
  const certificate = weeks.some(w=>w.n===10) ? `<section class="wb-sec wb-cert">${certificateHTML()}</section>` : '';
  return wbCover() + wbWelcome(weeks) + wbRubricPage() + wbSchedule() + parts.join('') + certificate;
}
function renderWorkbook(){
  const weeks = wbWeeks();
  return `
  ${topnav('Home / Student workbook')}
  <div class="wrap section no-print">
    <div class="section-head"><div class="kicker">PRINT ONCE, USE ALL TERM</div><h2>Student Workbook</h2></div>
    <p style="color:var(--ink-soft);max-width:640px;">One booklet with every page students write on — cover, the term reading schedule, week overview and project menu, reading-day pages and the Friday quiz. It grows automatically as more weeks are added to the app, so print it at the start of the topic.</p>
    <p style="font-size:.9rem;"><strong>Included so far:</strong> ${weeks.map(w=>'Week '+w.n).join(', ')} <span style="color:var(--ink-soft);">(${weeks.length+1<10 ? 'Weeks '+(weeks.length+1)+'–10' : 'Week 10'} will appear here once built)</span></p>
    <div class="lp-actions"><button class="btn" onclick="window.print()">${PRINT_ICON_HTML} Print workbook</button><button class="btn ghost" onclick="nav('landing')">← Back to Home</button></div>
    <p class="save-note">Print tips: choose A4, double-sided (flip on long edge), and turn off "Headers and footers" in the print dialog. Choose "Save as PDF" to make a file for your school's print room. This includes students' own copy of the whole-programme rubric (tick boxes, no marking guide) — full lesson plans, quiz answer keys and the rubric marking guide are in the separate <button class="linklike" onclick="nav('teacherbook')">Teacher Book</button>. Below is a preview.</p>
  </div>
  <div class="wb-doc">${wbBook()}</div>
  <div class="no-print"><footer>Student workbook · covers ${weeks.length} of 10 weeks so far</footer></div>`;
}

/* =====================================================================
   TEACHER BOOK — the teacher's equivalent of the student workbook.
   One printable booklet containing the reading schedule, the rubric
   marking guide (descriptors, not tick boxes), and every week's full
   NZC lesson plans + quiz answer keys, so nothing needs printing
   separately once the term starts. Reuses the same cover artwork as
   the Student Workbook (IMG_WB_COVER) with different cover text.
   ===================================================================== */
function tbCover(){
  return `<section class="wb-sec wb-cover"><img src="${IMG_WB_COVER}" alt="Boy: Tales of Childhood — Teacher Book cover">
    <div class="wb-title"><b>BOY</b><i>Tales of Childhood</i><span>Teacher Book</span></div>
    <div class="wb-name">Teacher</div></section>`;
}
function tbWelcome(weeks){
  return `<section class="wb-sec"><div class="wb-kick">WELCOME</div><h2>Your Boy teacher book</h2>
    <p>Print this once at the start of the topic and it covers the whole term: the reading schedule, rubric marking support, and every week's full NZC-aligned lesson plans and quiz answer keys.</p>
    <h3>What's inside</h3>
    <p><b>Reading schedule</b> — every day of the term</p>
    <p><b>Rubric marking guide</b> — what Not Achieved / Achieved / Excelled could look like for each of the 8 whole-programme criteria</p>
    ${weeks.map(w=>`<p><b>Week ${w.n}</b> — ${w.theme} — full lesson plans${w.n!==10 ? ' + quiz answer key' : ' + final project & rubric overview'}</p>`).join('')}
    <p style="font-size:.8rem;color:#6b5e4a;">This booklet is for teacher use — it contains quiz answers and marking guidance, so keep it separate from the Student Workbook.</p>
  </section>`;
}
function tbRubricSupport(){
  return `<section class="wb-sec"><div class="wb-kick">RUBRIC SUPPORT</div><h2>Rubric Marking Guide</h2>
    <p style="font-size:.85rem;">One rubric covers the whole ten-week study — there is no separate rubric per lesson or per project. Use the descriptors below to help decide whether a student's evidence for each criterion is Not Achieved, Achieved or Excelled when using the interactive rubric (or the paper version) on the app. Students see the same 8 criteria in kid-friendly language, with blank tick boxes, at the front of their own workbook.</p>
    ${rubricGuideHTML()}
  </section>`;
}
function tbWeekSection(n){
  const w = WEEKS[n].data;
  if(n===10){
    const lessons = w.lessons.map(l=>`<div class="wb-box"><b>${l.label} — ${l.title}</b><p>${l.blurb}</p></div>`).join('');
    const options = w.options.map(p=>`<p>${p.icon} <b>${p.title}:</b> ${p.text}</p>`).join('');
    return `<section class="wb-sec"><div class="wb-kick">WEEK 10 — TEACHER OVERVIEW</div><h2>${WEEK_THEMES[9]}</h2>
      <div class="wb-box"><b>LEARNING INTENTION</b><p>${w.li}</p></div>
      <div class="wb-box"><b>SUCCESS CRITERIA</b><p>${w.sc}</p></div>
      <h3>Three lessons</h3>${lessons}
      <h3>Final project options</h3>${options}
      <h3>How this is marked</h3>
      <p style="font-size:.85rem;">Assessed against the whole-programme rubric (see Rubric Support at the front of this book) — especially:</p>
      <ul>${rubricListHTML(w.rubricIds)}</ul>
      <p style="font-size:.85rem;">A printable "Boy Book Study — Completed!" certificate template is available from the app's Week 10 page for every student.</p>
    </section>`;
  }
  const dayBlocks = w.days.map(d=>{
    curWeek = n;
    let block = `<section class="wb-sec">${lessonPlanHTML(d)}</section>`;
    if(d.mode==='quiz') block += `<section class="wb-sec">${buildQuizPrintable(true)}</section>`;
    return block;
  }).join('');
  const projectLine = w.projects.map(p=>`${p.icon} ${p.title}`).join(' · ');
  return `<section class="wb-sec"><div class="wb-kick">WEEK ${n} — TEACHER OVERVIEW</div><h2>${WEEK_THEMES[n-1]}</h2>
    <div class="wb-box"><b>LEARNING INTENTION</b><p>${w.li}</p></div>
    <div class="wb-box"><b>SUCCESS CRITERIA</b><p>${w.sc}</p></div>
    <h3>Spare-time project menu</h3><p style="font-size:.85rem;">${projectLine}</p>
  </section>${dayBlocks}`;
}
function tbBook(){
  const savedWeek = curWeek;
  const weeks = wbWeeks();
  const sections = weeks.map(w=>tbWeekSection(w.n)).join('');
  curWeek = savedWeek;
  return tbCover() + tbWelcome(weeks) + wbSchedule() + tbRubricSupport() + sections;
}
function renderTeacherBook(){
  const weeks = wbWeeks();
  return `
  ${topnav('Home / Teacher book')}
  <div class="wrap section no-print">
    <div class="section-head"><div class="kicker">PRINT ONCE, USE ALL TERM</div><h2>Teacher Book</h2></div>
    <p style="color:var(--ink-soft);max-width:640px;">The teacher's equivalent of the Student Workbook: the reading schedule, the rubric marking guide (descriptors for each level, to support consistent judgement), and full NZC-aligned lesson plans plus quiz answer keys for every week — all in one document, so nothing needs printing separately once the term starts.</p>
    <p style="font-size:.9rem;"><strong>Included so far:</strong> ${weeks.map(w=>'Week '+w.n).join(', ')} <span style="color:var(--ink-soft);">(${weeks.length+1<10 ? 'Weeks '+(weeks.length+1)+'–10' : 'Week 10'} will appear here once built)</span></p>
    <div class="lp-actions"><button class="btn" onclick="window.print()">${PRINT_ICON_HTML} Print teacher book</button><button class="btn ghost" onclick="nav('landing')">← Back to Home</button></div>
    <p class="save-note">Print tips: choose A4, double-sided, and turn off "Headers and footers". This booklet contains quiz answers and marking guidance — keep it separate from the Student Workbook. Below is a preview.</p>
  </div>
  <div class="wb-doc">${tbBook()}</div>
  <div class="no-print"><footer>Teacher book · covers ${weeks.length} of 10 weeks so far</footer></div>`;
}

/* ============ MAIN RENDER ============ */
let lastRenderKey = null;
let revealObs = null;
function render(){
  const app = document.getElementById('app');
  const key = state.view + '|' + curWeek + '|' + state.day;
  const fresh = key !== lastRenderKey; lastRenderKey = key;
  app.classList.toggle('static', !fresh);
  if(state.view==='landing') app.innerHTML = renderLanding();
  else if(state.view==='weekhub') app.innerHTML = renderWeekHub();
  else if(state.view==='day') app.innerHTML = renderDay(state.day);
  else if(state.view==='lessonplan') app.innerHTML = renderLessonPlanView(state.day);
  else if(state.view==='weekpack') app.innerHTML = renderWeekPack();
  else if(state.view==='rubric') app.innerHTML = renderRubricPage();
  else if(state.view==='rubricguide') app.innerHTML = renderRubricGuide();
  else if(state.view==='teacherbook') app.innerHTML = renderTeacherBook();
  else if(state.view==='quizprint') app.innerHTML = renderQuizPrintPage(false);
  else if(state.view==='quizprintkey') app.innerHTML = renderQuizPrintPage(true);
  else if(state.view==='workbook') app.innerHTML = renderWorkbook();
  else if(state.view==='readingplan') app.innerHTML = renderReadingPlan();
  else if(state.view==='certificate') app.innerHTML = renderCertificatePrint();
  /* A4 + full-bleed cover page only while a booklet is on screen, so other print jobs are unchanged */
  document.getElementById('pageRules').textContent = (state.view==='workbook' || state.view==='teacherbook')
    ? '@page{size:A4;margin:14mm 14mm 16mm;@bottom-center{content:counter(page);font:9pt sans-serif;color:#777}} @page:first{margin:0;@bottom-center{content:none}}'
    : state.view==='readingplan' ? '@page{size:A4;margin:14mm 14mm 16mm}' : '';
  const els = app.querySelectorAll('.reveal');
  if(!fresh || !('IntersectionObserver' in window)) els.forEach(e=>e.classList.add('in'));
  else {
    if(!revealObs) revealObs = new IntersectionObserver(en=>en.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); revealObs.unobserve(x.target); } }), {threshold:.1, rootMargin:'0px 0px -40px 0px'});
    els.forEach(e=>revealObs.observe(e));
  }
  if(state.view==='day' && curWeek!==10) quizProgress();
  onScroll();
}
function onScroll(){
  document.querySelectorAll('[data-parallax]').forEach(el=>{ el.style.translate = `0 ${Math.min(window.scrollY,900)*0.3}px`; });
}
window.addEventListener('scroll', onScroll, {passive:true});

/* Keyboard nav for slideshow */
document.addEventListener('keydown', e=>{
  if(state.view!=='day' || curWeek===10) return;
  if(e.target.matches && e.target.matches('input,textarea,[contenteditable]')) return;
  const day = CW().days.find(d=>d.key===state.day);
  if(!day || day.mode!=='teacher') return;
  if(e.key==='ArrowRight' || e.key===' '){ e.preventDefault(); goSlide(slideIdx+1); }
  if(e.key==='ArrowLeft') goSlide(slideIdx-1);
  if(e.key==='f' || e.key==='F') toggleFullscreen();
});

/* init */
applyHash();
try{ history.replaceState({view:state.view, day:state.day, week:curWeek}, '', location.href); }catch(e){}
spawnSweets();
render();
