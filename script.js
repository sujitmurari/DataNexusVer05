/* ==========================================
   DATANEXUS — MAIN INTERACTION SCRIPT
   ========================================== */

// ===== KPI COUNTER ANIMATION =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(ease * target);
    el.textContent = val + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initKPICounters() {
  const counters = document.querySelectorAll('.kpi-value[data-target]');
  if (!counters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.done) {
        e.target.dataset.done = 'true';
        animateCounter(e.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => obs.observe(c));
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusEl = document.getElementById('form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '[ TRANSMITTING... ]';
    submitBtn.disabled = true;

    if (statusEl) {
      statusEl.textContent = '> Establishing secure channel...';
      statusEl.className = 'form-status';
    }

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        if (statusEl) {
          statusEl.textContent = '> MESSAGE TRANSMITTED SUCCESSFULLY ✓';
          statusEl.className = 'form-status success';
        }
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '> CONNECTION ERROR — Please try again or email directly.';
        statusEl.className = 'form-status error';
      }
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ===== SMOOTH PAGE TRANSITIONS =====
function initPageTransitions() {
  // Only apply fade transitions on http/https — skip for file:// protocol
  if (window.location.protocol === 'file:') return;

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const wrapper = document.getElementById('site-wrapper');
      if (wrapper) {
        wrapper.style.opacity = '0';
        wrapper.style.transition = 'opacity 0.3s ease';
        setTimeout(() => { window.location.href = href; }, 300);
      } else {
        window.location.href = href;
      }
    });
  });
}

// ===== LIVE DATA STREAM (hero decoration) =====
function initDataStream() {
  const rows = document.querySelectorAll('.stream-row');
  if (!rows.length) return;

  const metrics = [
    ['DATA.IN', '247.3 GB'],
    ['QUERIES', '1,842'],
    ['ACCURACY', '97.4%'],
    ['LATENCY', '12ms'],
    ['NODES', '16'],
    ['UPTIME', '99.98%'],
    ['MODELS', '4'],
    ['ALERTS', '0'],
  ];

  rows.forEach((row, i) => {
    const m = metrics[i % metrics.length];
    row.querySelector('.stream-key').textContent = m[0];
    row.querySelector('.stream-val').textContent = m[1];
  });

  // Randomly update values
  setInterval(() => {
    const row = rows[Math.floor(Math.random() * rows.length)];
    const val = row.querySelector('.stream-val');
    if (!val) return;

    const origOpacity = row.style.opacity;
    row.style.opacity = '1';
    row.style.color = 'var(--green)';

    setTimeout(() => {
      row.style.color = '';
      row.style.opacity = origOpacity;
    }, 300);
  }, 1800);
}

// ===== CURSOR TRAIL =====
function initCursorEffect() {
  const trail = document.createElement('div');
  trail.style.cssText = `
    position: fixed;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--cyan);
    pointer-events: none;
    z-index: 9998;
    box-shadow: 0 0 6px var(--cyan);
    transition: transform 0.1s ease;
    mix-blend-mode: screen;
  `;
  document.body.appendChild(trail);

  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    trail.style.left = mouseX - 2 + 'px';
    trail.style.top = mouseY - 2 + 'px';
  });
}

// ===== TERMINAL LOG TICKER =====
function initTerminalTicker() {
  const ticker = document.getElementById('terminal-ticker');
  if (!ticker) return;

  const messages = [
    'DATANEXUS ONLINE',
    'ANALYTICS ENGINE: ACTIVE',
    'PROCESSING DATA STREAMS...',
    'TABLEAU CONNECTED',
    'SQL QUERIES: 1,842 EXECUTED',
    'PYTHON MODELS: LOADED',
    'KPI MONITORING: LIVE',
    'DASHBOARD STATUS: OPTIMAL',
    'ANALYST: SUJIT MURARI',
    'STATUS: READY FOR INSIGHTS',
  ];

  let idx = 0;

  function showNext() {
    ticker.style.opacity = '0';
    setTimeout(() => {
      ticker.textContent = '> ' + messages[idx % messages.length];
      ticker.style.opacity = '1';
      idx++;
    }, 400);
  }

  ticker.style.transition = 'opacity 0.4s';
  showNext();
  setInterval(showNext, 4000);
}

// ===== PROJECT CARD HOVER EFFECT =====
function initProjectCards() {
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ===== GLITCH TITLE EFFECT =====
function initGlitchTitles() {
  document.querySelectorAll('[data-glitch]').forEach(el => {
    el.setAttribute('data-text', el.textContent);
  });
}

// ===== INIT ALL =====
document.addEventListener('DOMContentLoaded', () => {
  initKPICounters();
  initContactForm();
  initDataStream();
  initTerminalTicker();
  initProjectCards();
  initGlitchTitles();

  // Cursor only on desktop
  if (window.innerWidth > 768) {
    initCursorEffect();
  }

  // Page transitions (delay to allow loader to finish)
  setTimeout(initPageTransitions, 100);
});
