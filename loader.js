'use strict';
/* ==========================================================
   DN3 LOADER — Fail-safe architecture:
   - #page is ALWAYS visible (no opacity trick)
   - #boot is position:fixed overlay — we just REMOVE it
   - 7s absolute failsafe clears boot no matter what
   ========================================================== */

// Boot log lines: t = absolute ms from DOMContentLoaded
var LINES = [
  { t:  80, html: '<span style="color:#00d4ff">[SYS]</span> DATANEXUS v2.0 — Analytics Platform' },
  { t: 450, html: '<span style="color:#00d4ff">[INF]</span> Initializing analytics kernel...' },
  { t: 850, html: '<span style="color:#00ff88">[OK ]</span> Memory allocated: 8.2 GB' },
  { t:1150, html: '<span style="color:#00ff88">[OK ]</span> Module: <span style="color:#00d4ff">tableau.connector</span>' },
  { t:1450, html: '<span style="color:#00ff88">[OK ]</span> Module: <span style="color:#00d4ff">sql.engine</span>' },
  { t:1750, html: '<span style="color:#00ff88">[OK ]</span> Module: <span style="color:#00d4ff">python.analytics</span>' },
  { t:2050, html: '<span style="color:#00ff88">[OK ]</span> Module: <span style="color:#00d4ff">excel.processor</span>' },
  { t:2350, html: '<span style="color:#00ff88">[OK ]</span> Module: <span style="color:#00d4ff">pandas.dataframes</span>' },
  { t:2700, html: '<span style="color:#ff6b35">[INF]</span> Calibrating dashboard environment...' },
  { t:2950, html: '<span style="color:#00ff88">[OK ]</span> Visualization engine ready' },
  { t:3200, html: '<span style="color:#00ff88">[OK ]</span> KPI metrics loaded — 4 dashboards active' },
  { t:3450, html: '<span style="color:#00d4ff">――――――――――――――――――――――――――――――――――――</span>' },
  { t:3650, html: '<span style="color:#00ff88"> >> SYSTEM READY. Welcome, Analyst.</span>' }
];

/* Remove the boot overlay */
function clearBoot() {
  var el = document.getElementById('boot');
  if (!el) return;
  el.classList.add('done');
  setTimeout(function() {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 700);
}

/* Boot sequence — only on index.html */
function runBoot() {
  var box  = document.getElementById('boot-box');
  var fill = document.getElementById('boot-fill');
  var pct  = document.getElementById('boot-pct');
  var total = LINES.length;

  /* Absolute failsafe — always fires after 7s */
  var failsafe = setTimeout(clearBoot, 7000);

  LINES.forEach(function(item, i) {
    setTimeout(function() {
      /* Add line */
      if (box) {
        var row = document.createElement('div');
        row.className = 'boot-line';
        row.innerHTML = item.html;
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;
      }
      /* Progress */
      var p = Math.round(((i + 1) / total) * 100);
      if (fill) fill.style.width = p + '%';
      if (pct)  pct.textContent  = p + '%';
      /* Last line */
      if (i === total - 1) {
        clearTimeout(failsafe);
        setTimeout(clearBoot, 900);
      }
    }, item.t);
  });
}

/* Matrix rain */
function rain() {
  var c = document.getElementById('matrix');
  if (!c) return;
  var ctx = c.getContext('2d');
  var CH  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*><{}[]|=+-~';
  var FS  = 12;
  var cols, drops;
  function resize() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    cols = Math.floor(c.width / FS);
    drops = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.random() * -100 | 0;
  }
  resize();
  window.addEventListener('resize', resize);
  setInterval(function() {
    ctx.fillStyle = 'rgba(3,8,15,.07)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#00d4ff';
    ctx.font = FS + 'px monospace';
    for (var i = 0; i < cols; i++) {
      ctx.fillText(CH[Math.random() * CH.length | 0], i * FS, drops[i] * FS);
      if (drops[i] * FS > c.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }, 55);
}

/* Scroll reveal */
function reveals() {
  var fis = document.querySelectorAll('.fi');
  var bars = document.querySelectorAll('.sk-fill');

  if (!('IntersectionObserver' in window)) {
    fis.forEach(function(e) { e.classList.add('show'); });
    bars.forEach(function(b) {
      var w = b.getAttribute('data-w'); if (w) b.style.width = w;
    });
    return;
  }

  var fo = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('show'); });
  }, { threshold: 0.08 });
  fis.forEach(function(e) { fo.observe(e); });

  var bo = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var w = e.target.getAttribute('data-w');
        if (w) e.target.style.width = w;
      }
    });
  }, { threshold: 0.15 });
  bars.forEach(function(b) { bo.observe(b); });
}

/* Nav active */
function navActive() {
  var pg = window.location.pathname.split('/').pop() || 'index.html';
  if (!pg) pg = 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mob a').forEach(function(a) {
    var h = (a.getAttribute('href') || '').replace('./', '');
    if (h === pg) a.classList.add('active');
  });
}

/* Mobile nav */
function mobileNav() {
  var btn = document.getElementById('nav-ham');
  var mob = document.getElementById('nav-mob');
  if (!btn || !mob) return;
  btn.addEventListener('click', function() { mob.classList.toggle('open'); });
  mob.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() { mob.classList.remove('open'); });
  });
}

/* Clock */
function clock() {
  var el = document.getElementById('clock');
  if (!el) return;
  function tick() {
    var d = new Date();
    el.textContent =
      ('0' + d.getHours()).slice(-2) + ':' +
      ('0' + d.getMinutes()).slice(-2) + ':' +
      ('0' + d.getSeconds()).slice(-2);
  }
  tick();
  setInterval(tick, 1000);
}

/* Ticker */
function ticker() {
  var el = document.getElementById('ticker');
  if (!el) return;
  var M = ['DATANEXUS ONLINE', 'ANALYTICS ENGINE: ACTIVE', 'PROCESSING DATA STREAMS',
           'TABLEAU CONNECTED', 'SQL QUERIES: 1,842 EXECUTED', 'PYTHON MODELS: LOADED',
           'KPI MONITORING: LIVE', 'ANALYST: SUJIT MURARI', 'STATUS: READY'];
  var i = 0;
  el.style.transition = 'opacity 0.4s';
  setInterval(function() {
    el.style.opacity = '0';
    setTimeout(function() { el.textContent = '> ' + M[i++ % M.length]; el.style.opacity = '1'; }, 420);
  }, 4000);
}

/* Init */
document.addEventListener('DOMContentLoaded', function() {
  var path  = window.location.pathname;
  var isIdx = path === '/' || path === '' || path.endsWith('/')
           || path.toLowerCase().endsWith('index.html');

  if (isIdx) {
    runBoot();
  } else {
    /* Non-index: just remove boot instantly */
    var b = document.getElementById('boot');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  rain();
  reveals();
  navActive();
  mobileNav();
  clock();
  ticker();
});
