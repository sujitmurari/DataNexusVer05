/* ==========================================
   DATANEXUS — LOADER & MATRIX RAIN ENGINE
   ========================================== */

// ===== BOOT SEQUENCE =====
const bootLines = [
  { text: '<span class="prompt">[SYS]</span> DATANEXUS v2.0 — Analytics Intelligence Platform', delay: 0 },
  { text: '<span class="prompt">[INF]</span> Initializing analytics kernel...', delay: 400 },
  { text: '<span class="ok">[OK ]</span> Memory allocation: 8.2 GB', delay: 700 },
  { text: '<span class="ok">[OK ]</span> Loading module: <span class="prompt">tableau.connector</span>', delay: 1000 },
  { text: '<span class="ok">[OK ]</span> Loading module: <span class="prompt">sql.engine</span>', delay: 1200 },
  { text: '<span class="ok">[OK ]</span> Loading module: <span class="prompt">python.analytics</span>', delay: 1400 },
  { text: '<span class="ok">[OK ]</span> Loading module: <span class="prompt">excel.processor</span>', delay: 1600 },
  { text: '<span class="ok">[OK ]</span> Loading module: <span class="prompt">pandas.dataframes</span>', delay: 1800 },
  { text: '<span class="warn">[INF]</span> Calibrating dashboard environment...', delay: 2100 },
  { text: '<span class="ok">[OK ]</span> Visualization engine ready', delay: 2400 },
  { text: '<span class="ok">[OK ]</span> KPI metrics loaded', delay: 2600 },
  { text: '<span class="prompt">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>', delay: 2800 },
  { text: '<span class="ok">  ██ SYSTEM READY — Welcome, Analyst. ██</span>', delay: 3000 },
];

// ===== SAFE sessionStorage WRAPPER =====
// FIX: sessionStorage access can throw in private/restricted browsing modes,
// crashing the entire DOMContentLoaded handler and leaving site-wrapper invisible.
function safeSessionGet(key) {
  try { return sessionStorage.getItem(key); } catch (e) { return null; }
}
function safeSessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch (e) { /* ignore */ }
}

function runBootSequence() {
  const screen = document.getElementById('boot-screen');
  if (!screen) return;

  const terminal = document.getElementById('boot-terminal');
  const progressFill = document.getElementById('boot-progress-fill');
  const progressPct = document.getElementById('boot-progress-pct');
  const wrapper = document.getElementById('site-wrapper');

  if (!terminal) return;

  let lineIndex = 0;

  function addLine() {
    if (lineIndex >= bootLines.length) return;
    const item = bootLines[lineIndex];

    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'boot-line';
      el.innerHTML = item.text;
      terminal.appendChild(el);

      requestAnimationFrame(() => {
        el.classList.add('active');
      });

      // scroll to bottom
      terminal.scrollTop = terminal.scrollHeight;

      // Update progress
      const pct = Math.round(((lineIndex + 1) / bootLines.length) * 100);
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';

      lineIndex++;
      addLine();
    }, item.delay);
  }

  addLine();

  // Fade out after all lines done
  const totalDelay = bootLines[bootLines.length - 1].delay + 1200;

  setTimeout(() => {
    screen.classList.add('fade-out');
    if (wrapper) {
      setTimeout(() => {
        wrapper.classList.add('visible');
        screen.style.display = 'none';
        startMatrixRain();
        initScrollAnimations();
      }, 800);
    }
  }, totalDelay);
}

// ===== MATRIX RAIN =====
function startMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*><{}[]|=+-~';
  const fontSize = 12;
  let cols = Math.floor(canvas.width / fontSize);
  let drops = Array(cols).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(4, 10, 18, 0.07)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00d4ff';
    ctx.font = fontSize + 'px Share Tech Mono, monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(draw, 55);
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  // Fade-in elements
  const fadeEls = document.querySelectorAll('.fade-in');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  fadeEls.forEach(el => obs.observe(el));

  // Skill bars
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  const skillObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = e.target.dataset.width;
        e.target.style.width = target;
      }
    });
  }, { threshold: 0.2 });

  skillBars.forEach(bar => skillObs.observe(bar));
}

// ===== NAV ACTIVE STATE =====
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = (a.getAttribute('href') || "").replace("./", "");
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ===== MOBILE NAV =====
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('nav-mobile');

  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

// ===== TERMINAL TYPING EFFECT =====
function typeTerminal(el, text, speed = 40) {
  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

// ===== LIVE CLOCK =====
function startClock() {
  const clockEl = document.getElementById('nav-clock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }

  update();
  setInterval(update, 1000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // FIX: Wrap entire init in try/catch so a JS error never leaves the page invisible.
  try {
    const isHome = window.location.pathname.endsWith('index.html') ||
                   window.location.pathname.endsWith('/') ||
                   window.location.pathname === '';

    const bootScreen = document.getElementById('boot-screen');
    const wrapper = document.getElementById('site-wrapper');

    // FIX: Use safe wrappers — sessionStorage throws in some private/restricted contexts.
    const alreadyBooted = safeSessionGet('datanexus_booted');

    if (bootScreen) {
      if (isHome && !alreadyBooted) {
        safeSessionSet('datanexus_booted', 'true');
        runBootSequence();
      } else {
        bootScreen.style.display = 'none';
        if (wrapper) wrapper.classList.add('visible');
        startMatrixRain();
        initScrollAnimations();
      }
    } else {
      // Sub-pages with no boot screen element: show immediately
      if (wrapper) wrapper.classList.add('visible');
      startMatrixRain();
      initScrollAnimations();
    }

    setActiveNav();
    initMobileNav();
    startClock();

  } catch (err) {
    // FIX: Last-resort fallback — if anything above throws, force the page visible
    // so users are never stuck on a black screen.
    console.error('[DataNexus] Loader error:', err);
    const wrapper = document.getElementById('site-wrapper');
    if (wrapper) wrapper.classList.add('visible');
  }
});
