'use strict';
/* ============================================================
   DATANEXUS — SCRIPT v3
   KPI counters, contact form, project tilt, cursor trail
   ============================================================ */

// ── KPI COUNTER ANIMATION ─────────────────────────────────────
function animateCounter(el) {
  var target = parseInt(el.getAttribute('data-target'), 10);
  var suffix = el.getAttribute('data-suffix') || '';
  if (isNaN(target)) return;
  var duration = 1400;
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var elapsed = ts - start;
    var p = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

function initKPICounters() {
  var counters = document.querySelectorAll('.kpi-value[data-target]');
  if (!counters.length) return;
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter); return;
  }
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !e.target.getAttribute('data-done')) {
        e.target.setAttribute('data-done', '1');
        animateCounter(e.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(function(c) { obs.observe(c); });
}

// ── CONTACT FORM ──────────────────────────────────────────────
function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var statusEl = document.getElementById('form-status');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = form.querySelector('[type="submit"]');
    var orig = btn.textContent;
    btn.textContent = '[ TRANSMITTING... ]';
    btn.disabled = true;
    if (statusEl) { statusEl.textContent = '> Establishing secure channel...'; statusEl.className = 'form-status'; }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function(r) {
      if (r.ok) {
        if (statusEl) { statusEl.textContent = '> MESSAGE TRANSMITTED SUCCESSFULLY'; statusEl.className = 'form-status success'; }
        form.reset();
      } else { throw new Error('Server error'); }
    }).catch(function() {
      if (statusEl) { statusEl.textContent = '> CONNECTION ERROR — Please email directly.'; statusEl.className = 'form-status error'; }
    }).finally(function() {
      btn.textContent = orig; btn.disabled = false;
    });
  });
}

// ── PROJECT CARD TILT ─────────────────────────────────────────
function initProjectCards() {
  document.querySelectorAll('.project-card').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var r = card.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - 0.5) * 8;
      var y = ((e.clientY - r.top) / r.height - 0.5) * 8;
      card.style.transform = 'perspective(600px) rotateY(' + x + 'deg) rotateX(' + (-y) + 'deg)';
    });
    card.addEventListener('mouseleave', function() { card.style.transform = ''; });
  });
}

// ── CURSOR TRAIL (desktop only) ───────────────────────────────
function initCursorTrail() {
  if (window.innerWidth <= 768) return;
  var dot = document.createElement('div');
  dot.style.cssText = 'position:fixed;width:5px;height:5px;border-radius:50%;background:#00d4ff;pointer-events:none;z-index:9998;box-shadow:0 0 8px #00d4ff;mix-blend-mode:screen;transition:transform 0.1s';
  document.body.appendChild(dot);
  document.addEventListener('mousemove', function(e) {
    dot.style.left = (e.clientX - 2) + 'px';
    dot.style.top = (e.clientY - 2) + 'px';
  });
}

// ── DATA STREAM (hero decoration) ────────────────────────────
function initDataStream() {
  var rows = document.querySelectorAll('.stream-row');
  if (!rows.length) return;
  setInterval(function() {
    var row = rows[Math.floor(Math.random() * rows.length)];
    var val = row.querySelector('.stream-val');
    if (!val) return;
    var prev = row.style.color;
    row.style.color = '#00ff88';
    setTimeout(function() { row.style.color = prev; }, 350);
  }, 1800);
}

// ── GLITCH DATA-TEXT ATTR ─────────────────────────────────────
function initGlitch() {
  document.querySelectorAll('[data-glitch]').forEach(function(el) {
    el.setAttribute('data-text', el.textContent);
  });
}

// ── PAGE TRANSITIONS (http/https only) ───────────────────────
function initPageTransitions() {
  if (window.location.protocol === 'file:') return;
  document.querySelectorAll('a[href]').forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('http') === 0 || href.indexOf('mailto') === 0) return;
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var w = document.getElementById('site-wrapper');
      if (w) { w.style.transition = 'opacity 0.3s'; w.style.opacity = '0'; setTimeout(function() { window.location.href = href; }, 300); }
      else { window.location.href = href; }
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initKPICounters();
  initContactForm();
  initProjectCards();
  initDataStream();
  initGlitch();
  initCursorTrail();
  setTimeout(initPageTransitions, 200);
});
