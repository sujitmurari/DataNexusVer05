'use strict';
/* ==========================================================
   DN3 SCRIPT — KPI counters, form, tilt, cursor trail
   ========================================================== */

/* KPI counter */
function kpi() {
  var els = document.querySelectorAll('[data-kpi]');
  if (!els.length) return;
  var done = {};

  function run(el) {
    var target = parseInt(el.getAttribute('data-kpi'), 10);
    var sfx    = el.getAttribute('data-sfx') || '';
    if (isNaN(target) || done[el]) return;
    done[el] = true;
    var start = null;
    var dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (ease * target | 0) + sfx;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + sfx;
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  var obs = new IntersectionObserver(function(e) {
    e.forEach(function(en) { if (en.isIntersecting) run(en.target); });
  }, { threshold: 0.4 });
  els.forEach(function(el) { obs.observe(el); });
}

/* Contact form */
function form() {
  var f = document.getElementById('cf');
  if (!f) return;
  var st = document.getElementById('fs');
  f.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = f.querySelector('[type=submit]');
    var orig = btn.textContent;
    btn.textContent = '[ TRANSMITTING... ]';
    btn.disabled = true;
    if (st) { st.textContent = '> Opening secure channel...'; st.className = 'f-status'; }
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
      .then(function(r) {
        if (!r.ok) throw 0;
        if (st) { st.textContent = '> TRANSMITTED SUCCESSFULLY'; st.className = 'f-status ok'; }
        f.reset();
      })
      .catch(function() {
        if (st) { st.textContent = '> ERROR — Email directly instead.'; st.className = 'f-status err'; }
      })
      .finally(function() { btn.textContent = orig; btn.disabled = false; });
  });
}

/* Project card tilt */
function tilt() {
  document.querySelectorAll('.proj-card').forEach(function(c) {
    c.addEventListener('mousemove', function(e) {
      var r = c.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width  - 0.5) * 7;
      var y = ((e.clientY - r.top)  / r.height - 0.5) * 7;
      c.style.transform = 'perspective(600px) rotateY(' + x + 'deg) rotateX(' + (-y) + 'deg)';
    });
    c.addEventListener('mouseleave', function() { c.style.transform = ''; });
  });
}

/* Cursor dot */
function cursor() {
  if (window.innerWidth <= 768) return;
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;width:5px;height:5px;border-radius:50%;background:#00d4ff;pointer-events:none;z-index:9998;box-shadow:0 0 8px #00d4ff;mix-blend-mode:screen;transition:left .08s,top .08s';
  document.body.appendChild(d);
  document.addEventListener('mousemove', function(e) {
    d.style.left = (e.clientX - 2) + 'px';
    d.style.top  = (e.clientY - 2) + 'px';
  });
}

/* Init */
document.addEventListener('DOMContentLoaded', function() {
  kpi(); form(); tilt(); cursor();
});
