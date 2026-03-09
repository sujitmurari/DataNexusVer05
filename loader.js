'use strict';
/* ============================================================
   DATANEXUS — LOADER v3  (bulletproof rewrite)
   All delays are ABSOLUTE from boot-start using cumulative
   scheduling. No recursion. No sessionStorage issues.
   A hard failsafe forces the site visible after 7 seconds.
   ============================================================ */

var BOOT_LINES = [
  { html: '<span style="color:#00d4ff">[SYS]</span> DATANEXUS v2.0 — Analytics Intelligence Platform', t: 100 },
  { html: '<span style="color:#00d4ff">[INF]</span> Initializing analytics kernel...', t: 500 },
  { html: '<span style="color:#00ff88">[OK ]</span> Memory allocation: 8.2 GB confirmed', t: 900 },
  { html: '<span style="color:#00ff88">[OK ]</span> Loading module: <span style="color:#00d4ff">tableau.connector</span>', t: 1200 },
  { html: '<span style="color:#00ff88">[OK ]</span> Loading module: <span style="color:#00d4ff">sql.engine</span>', t: 1500 },
  { html: '<span style="color:#00ff88">[OK ]</span> Loading module: <span style="color:#00d4ff">python.analytics</span>', t: 1800 },
  { html: '<span style="color:#00ff88">[OK ]</span> Loading module: <span style="color:#00d4ff">excel.processor</span>', t: 2100 },
  { html: '<span style="color:#00ff88">[OK ]</span> Loading module: <span style="color:#00d4ff">pandas.dataframes</span>', t: 2400 },
  { html: '<span style="color:#ff6b35">[INF]</span> Calibrating dashboard environment...', t: 2750 },
  { html: '<span style="color:#00ff88">[OK ]</span> Visualization engine ready', t: 3000 },
  { html: '<span style="color:#00ff88">[OK ]</span> KPI metrics loaded — 4 dashboards online', t: 3250 },
  { html: '<span style="color:#00d4ff">--------------------------------------------------</span>', t: 3500 },
  { html: '<span style="color:#00ff88"> >> SYSTEM READY</span>', t: 3700 }
];

function showSite() {
  var boot = document.getElementById('boot-screen');
  var wrapper = document.getElementById('site-wrapper');
  if (boot) {
    boot.style.transition = 'opacity 0.7s ease';
    boot.style.opacity = '0';
    setTimeout(function() { boot.style.display = 'none'; }, 750);
  }
  if (wrapper) {
    wrapper.classList.add('visible');
    wrapper.style.opacity = '1';
  }
  startMatrixRain();
  initScrollAnimations();
}

function runBootSequence() {
  var terminal = document.getElementById('boot-terminal');
  var fillEl = document.getElementById('boot-progress-fill');
  var pctEl = document.getElementById('boot-progress-pct');
  var total = BOOT_LINES.length;
  var failsafe = setTimeout(showSite, 7000);

  BOOT_LINES.forEach(function(item, idx) {
    setTimeout(function() {
      if (terminal) {
        var row = document.createElement('div');
        row.style.cssText = 'color:#00ff88;font-size:0.82rem;margin-bottom:0.35rem;font-family:monospace;opacity:0;transition:opacity 0.3s';
        row.innerHTML = item.html;
        terminal.appendChild(row);
        setTimeout(function() { row.style.opacity = '1'; }, 30);
        terminal.scrollTop = terminal.scrollHeight;
      }
      var pct = Math.round(((idx + 1) / total) * 100);
      if (fillEl) fillEl.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
      if (idx === total - 1) {
        clearTimeout(failsafe);
        setTimeout(showSite, 900);
      }
    }, item.t);
  });
}

function startMatrixRain() {
  var canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*><{}[]|=+-~';
  var FS = 12;
  var cols, drops;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / FS);
    drops = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.floor(Math.random() * -50);
  }
  resize();
  window.addEventListener('resize', resize);

  setInterval(function() {
    ctx.fillStyle = 'rgba(4,10,18,0.07)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00d4ff';
    ctx.font = FS + 'px monospace';
    for (var i = 0; i < cols; i++) {
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FS, drops[i] * FS);
      if (drops[i] * FS > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }, 55);
}

function initScrollAnimations() {
  var fadeEls = document.querySelectorAll('.fade-in');
  var bars = document.querySelectorAll('.skill-bar-fill');

  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    fadeEls.forEach(function(el) { el.classList.add('visible'); });
    bars.forEach(function(b) { var w = b.getAttribute('data-width'); if (w) b.style.width = w; });
    return;
  }

  var fadeObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  fadeEls.forEach(function(el) { fadeObs.observe(el); });

  var barObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var w = e.target.getAttribute('data-width');
        if (w) e.target.style.width = w;
      }
    });
  }, { threshold: 0.15 });
  bars.forEach(function(b) { barObs.observe(b); });
}

function setActiveNav() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  if (!page || page === '') page = 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(function(a) {
    var href = (a.getAttribute('href') || '').replace('./', '');
    if (href === page) a.classList.add('active');
  });
}

function initMobileNav() {
  var toggle = document.getElementById('nav-toggle');
  var mob = document.getElementById('nav-mobile');
  if (!toggle || !mob) return;
  toggle.addEventListener('click', function() { mob.classList.toggle('open'); });
  mob.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() { mob.classList.remove('open'); });
  });
}

function startClock() {
  var el = document.getElementById('nav-clock');
  if (!el) return;
  function tick() {
    var d = new Date();
    el.textContent = String(d.getHours()).padStart(2,'0') + ':' +
                     String(d.getMinutes()).padStart(2,'0') + ':' +
                     String(d.getSeconds()).padStart(2,'0');
  }
  tick(); setInterval(tick, 1000);
}

function startTicker() {
  var el = document.getElementById('terminal-ticker');
  if (!el) return;
  var msgs = ['DATANEXUS ONLINE','ANALYTICS ENGINE: ACTIVE','PROCESSING DATA STREAMS...','TABLEAU CONNECTED','SQL QUERIES: 1,842 EXECUTED','PYTHON MODELS: LOADED','KPI MONITORING: LIVE','DASHBOARD STATUS: OPTIMAL','ANALYST: SUJIT MURARI','STATUS: READY'];
  var idx = 0;
  el.style.transition = 'opacity 0.4s';
  setInterval(function() {
    el.style.opacity = '0';
    setTimeout(function() { el.textContent = '> ' + msgs[idx++ % msgs.length]; el.style.opacity = '1'; }, 420);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', function() {
  var bootScreen = document.getElementById('boot-screen');
  var wrapper = document.getElementById('site-wrapper');
  var path = window.location.pathname;
  var isHome = path === '/' || path === '' || path.endsWith('/') || path.toLowerCase().endsWith('index.html');

  if (bootScreen && isHome) {
    runBootSequence();
  } else {
    if (bootScreen) bootScreen.style.display = 'none';
    if (wrapper) { wrapper.classList.add('visible'); wrapper.style.opacity = '1'; }
    startMatrixRain();
    initScrollAnimations();
  }

  setActiveNav();
  initMobileNav();
  startClock();
  startTicker();
});
