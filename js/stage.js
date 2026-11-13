/* Easter egg: a hidden disguise-style stage view, opened from the tiny icon in the footer. */
(function () {
  var ftr = document.querySelector('.ftr'); if (!ftr) return;
  var btn = document.createElement('button');
  btn.className = 'stg-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Stage view');
  btn.innerHTML = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor"><path d="M1 11 L5 7 H15 L11 11 Z"/><rect x="6" y="1" width="8" height="5"/></svg>';
  ftr.appendChild(btn);

  var box = document.createElement('div');
  box.className = 'stg'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Stage view');
  box.innerHTML =
    '<div class="stg-bar"><b>Stage</b><span>Visualiser</span><button class="stg-x" type="button" aria-label="Close">×</button></div>' +
    '<div class="stg-view"><div class="stg-world"></div></div>' +
    '<div class="stg-cl" data-cl>' +
      '<div class="stg-cl-bar"><span>Cue List</span><button type="button" class="stg-cl-tog" aria-expanded="true" aria-label="Show or hide cue list">▾</button></div>' +
      '<div class="stg-cl-body">' +
        '<div class="stg-cl-cfg"><span>Setlist</span><span>automatic</span></div>' +
        '<div class="stg-cl-row stg-cl-head"><span class="go"></span><span class="note">Note</span><span class="tag">Tag</span><span class="rem">Remaining</span></div>' +
        '<div class="stg-cl-list" data-cl-list></div>' +
      '</div>' +
    '</div>' +
    '<div class="stg-ctl" aria-label="Camera controls">' +
      '<div class="stg-pre"><button type="button" data-cam="foh">FOH</button><button type="button" data-cam="side">Side</button><button type="button" data-cam="top">Top</button></div>' +
      '<div class="stg-pad">' +
        '<button type="button" data-nudge="up" aria-label="Tilt up">▲</button>' +
        '<button type="button" data-nudge="left" aria-label="Orbit left">◀</button>' +
        '<button type="button" data-nudge="reset" aria-label="Reset view">●</button>' +
        '<button type="button" data-nudge="right" aria-label="Orbit right">▶</button>' +
        '<button type="button" data-nudge="down" aria-label="Tilt down">▼</button>' +
      '</div>' +
      '<div class="stg-zoom"><button type="button" data-nudge="in" aria-label="Zoom in">+</button><button type="button" data-nudge="out" aria-label="Zoom out">−</button></div>' +
    '</div>' +
    '<div class="stg-foot"><span class="g">● main</span><span data-stg-res></span><span data-stg-hint>drag to orbit</span><span data-stg-tc></span></div>';
  document.body.appendChild(box);

  var view = box.querySelector('.stg-view'), world = box.querySelector('.stg-world');
  var res = box.querySelector('[data-stg-res]'), tcOut = box.querySelector('[data-stg-tc]');
  var narrow = matchMedia('(max-width:700px)');
  var CAMS = { foh: [-14, -18, -6200], side: [-62, -16, -6600], top: [-4, -62, -7200] };
  function camZ(v) { return narrow.matches ? v - 5200 : v; }
  var ry = CAMS.foh[0], rx = CAMS.foh[1], z = camZ(CAMS.foh[2]), last = null, before = null, raf = 0;
  var ZMIN = -12000, ZMAX = -1500;

  /* ---- tiny CSS-3D scene builder (units ~ cm; y is down, -z is upstage) ---- */
  function div(cls, w, h, tf, style) {
    var d = document.createElement('div'); d.className = cls;
    d.style.cssText = 'width:' + w + 'px;height:' + h + 'px;margin:' + (-h / 2) + 'px 0 0 ' + (-w / 2) + 'px;transform:' + tf + ';' + (style || '');
    world.appendChild(d); return d;
  }
  function t3(x, y, zz) { return 'translate3d(' + x + 'px,' + y + 'px,' + zz + 'px) '; }
  // box with visible faces only (top, front, back, sides)
  function boxy(x, y, zz, w, h, d, cls) {
    var c = t3(x, y, zz);
    div(cls + ' f-top', w, d, c + 'rotateX(90deg) translateZ(' + h / 2 + 'px)');
    div(cls + ' f-front', w, h, c + 'translateZ(' + d / 2 + 'px)');
    div(cls + ' f-front', w, h, c + 'rotateY(180deg) translateZ(' + d / 2 + 'px)');
    div(cls + ' f-side', d, h, c + 'rotateY(90deg) translateZ(' + w / 2 + 'px)');
    div(cls + ' f-side', d, h, c + 'rotateY(-90deg) translateZ(' + w / 2 + 'px)');
  }
  function screen(x, y, zz, w, h, ry2, label, cls) {
    var s2 = div('stg-wall ' + (cls || ''), w, h, t3(x, y, zz) + 'rotateY(' + (ry2 || 0) + 'deg)');
    if (label) { var l = document.createElement('span'); l.className = 'stg-label'; l.textContent = label; s2.appendChild(l); }
    return s2;
  }
  function beam(x, top, bottom, zz, spread) {
    var h = bottom - top;
    [0, 90].forEach(function (r) {
      div('stg-beam', spread, h, t3(x, top + h / 2, zz) + 'rotateY(' + r + 'deg)');
    });
  }

  var walls = [];
  function build() {
    world.innerHTML = '';
    var DECK = 120;                                            // deck height
    div('stg-floor', 6400, 6400, 'rotateX(90deg)');
    // stage deck, thrust and B-stage
    boxy(0, -DECK / 2, -450, 2000, DECK, 900, 'stg-deck');
    boxy(0, -DECK / 2, 350, 240, DECK, 700, 'stg-deck');
    boxy(0, -DECK / 2, 900, 520, DECK, 520, 'stg-deck');
    // risers
    boxy(-520, -DECK - 30, -650, 500, 60, 300, 'stg-deck');
    boxy(520, -DECK - 30, -650, 500, 60, 300, 'stg-deck');
    // upstage video wall
    walls[0] = screen(0, -DECK - 330, -880, 1800, 660, 0, 'main');
    // IMAG screens, flown and angled toward the house
    walls[1] = screen(-1380, -720, -500, 560, 315, 18, 'imag l', 'stg-imag');
    walls[2] = screen(1380, -720, -500, 560, 315, -18, 'imag r', 'stg-imag');
    // performer for scale
    var man = div('stg-man', 44, 180, t3(0, -DECK - 90, -150));
    man.innerHTML = '<svg viewBox="0 0 44 120" preserveAspectRatio="none" fill="#d8d8d8"><circle cx="22" cy="9" r="7"/><path d="M12 20h20l4 40h-6l-2-26-1 84h-7l-2-48-2 48h-7l-1-84-2 26H8z"/></svg>';
  }
  build();

  function apply() { world.style.transform = 'translateZ(' + z + 'px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; }
  function tick() { var t = document.querySelector('.hdr [data-tc]'); if (t) tcOut.textContent = 'TC ' + t.textContent; raf = requestAnimationFrame(tick); }

  /* ---- d3-style cue list: each cue loads a show onto main + IMAG ---- */
  var listEl = box.querySelector('[data-cl-list]'), cueRows = [], cur = -1;
  var shows = (window.SHOWS || []).filter(function (s2) { return s2.photos && s2.photos.length; });
  function ttl(s2) { return s2.artist + (s2.show ? ' — ' + s2.show : ''); }
  function tcStr(sec) { var p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(Math.floor(sec / 3600)) + ':' + p(Math.floor(sec / 60) % 60) + ':' + p(sec % 60) + ':00'; }
  (function buildList() {
    var lastYear = null, t = 5, n = 0;
    shows.forEach(function (s2, i) {
      if (s2.year !== lastYear) {
        lastYear = s2.year; t = 5;
        listEl.appendChild(Object.assign(document.createElement('div'), { className: 'stg-cl-track', textContent: 'track ' + s2.year }));
      }
      n++;
      var row = document.createElement('button'); row.type = 'button'; row.className = 'stg-cl-row';
      var dur = 20 + (s2.photos.length * 5);
      row.innerHTML = '<span class="go">GO</span><span class="note"></span><span class="tag">' + tcStr(t) + '</span><span class="rem">(' + tcStr(dur).slice(0, 8) + '.00)</span>';
      row.querySelector('.note').textContent = 'Cue ' + n + ' (' + ttl(s2) + ')';
      row.addEventListener('click', function () { go(i); if (narrow.matches) setCL(false); });
      listEl.appendChild(row); cueRows.push(row); t += dur;
    });
  })();
  function go(i) {
    var s2 = shows[i]; if (!s2) return; cur = i;
    var ph = s2.photos, pick = function (k) { return ph[k % ph.length].src; };
    walls[0].style.backgroundImage = 'url("' + pick(0) + '")';
    walls[1].style.backgroundImage = 'url("' + pick(1) + '")';
    walls[2].style.backgroundImage = 'url("' + pick(2) + '")';
    cueRows.forEach(function (r, k) { r.classList.toggle('live', k === i); r.classList.toggle('next', k === i + 1); });
    res.textContent = 'cue ' + (i + 1) + ' · ' + ttl(s2);
    var row = cueRows[i]; if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
  }
  // pick the show currently on the hero timeline, else the first
  function heroShow() {
    var hero = document.querySelector('[data-hero-img]'), src = hero ? hero.getAttribute('src') : '';
    for (var i = 0; i < shows.length; i++) if (shows[i].photos.some(function (p) { return p.src === src; })) return i;
    return 0;
  }

  function open() {
    go(cur < 0 ? heroShow() : cur);
    if (narrow.matches) { setCL(false); ry = CAMS.foh[0]; rx = CAMS.foh[1]; z = camZ(CAMS.foh[2]); }
    box.querySelector('[data-stg-hint]').textContent = narrow.matches ? 'drag · pinch · pad' : 'drag to orbit · scroll to zoom';
    before = document.activeElement;
    box.classList.add('on'); document.documentElement.style.overflow = 'hidden';
    apply(); box.querySelector('.stg-x').focus(); if (!raf) tick();
  }
  function close() {
    box.classList.remove('on'); document.documentElement.style.overflow = '';
    cancelAnimationFrame(raf); raf = 0; if (before) before.focus();
  }

  btn.addEventListener('click', open);
  box.querySelector('.stg-x').addEventListener('click', close);
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('on')) close(); });
  /* ---- orbit (1 finger / mouse), pinch zoom (2 fingers), wheel zoom ---- */
  var pts = {}, pinch0 = 0, z0 = 0;
  function dist() { var k = Object.keys(pts); if (k.length < 2) return 0; var a2 = pts[k[0]], b2 = pts[k[1]]; return Math.hypot(a2[0] - b2[0], a2[1] - b2[1]); }
  view.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = [e.clientX, e.clientY]; view.setPointerCapture(e.pointerId); view.classList.add('drag');
    last = [e.clientX, e.clientY];
    if (Object.keys(pts).length === 2) { pinch0 = dist(); z0 = z; }
  });
  view.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = [e.clientX, e.clientY];
    if (Object.keys(pts).length >= 2) { var d = dist(); if (pinch0) { z = Math.max(ZMIN, Math.min(ZMAX, z0 + (d - pinch0) * 12)); apply(); } return; }
    ry += (e.clientX - last[0]) * .2; rx = Math.max(-70, Math.min(-3, rx - (e.clientY - last[1]) * .2));
    last = [e.clientX, e.clientY]; apply();
  });
  function up(e) { delete pts[e.pointerId]; pinch0 = 0; var k = Object.keys(pts); last = k.length ? pts[k[0]] : null; if (!k.length) view.classList.remove('drag'); }
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', function (e) { e.preventDefault(); z = Math.max(ZMIN, Math.min(ZMAX, z - e.deltaY * 1.2)); apply(); }, { passive: false });

  /* ---- on-screen 3D controls: presets, orbit pad, zoom ---- */
  var world3 = world;
  function ease() { world3.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; apply(); setTimeout(function () { world3.style.transition = ''; }, 520); }
  box.querySelectorAll('[data-cam]').forEach(function (b2) {
    b2.addEventListener('click', function () { var c = CAMS[b2.getAttribute('data-cam')]; ry = c[0]; rx = c[1]; z = camZ(c[2]); ease();
      box.querySelectorAll('[data-cam]').forEach(function (x) { x.classList.toggle('on', x === b2); }); });
  });
  box.querySelector('[data-cam="foh"]').classList.add('on');
  var hold = 0;
  function nudge(k) {
    if (k === 'left') ry -= 3; else if (k === 'right') ry += 3;
    else if (k === 'up') rx = Math.max(-70, rx - 2); else if (k === 'down') rx = Math.min(-3, rx + 2);
    else if (k === 'in') z = Math.min(ZMAX, z + 250); else if (k === 'out') z = Math.max(ZMIN, z - 250);
    else if (k === 'reset') { ry = CAMS.foh[0]; rx = CAMS.foh[1]; z = camZ(CAMS.foh[2]); ease(); return; }
    apply();
  }
  box.querySelectorAll('[data-nudge]').forEach(function (b2) {
    var k = b2.getAttribute('data-nudge');
    b2.addEventListener('pointerdown', function (e) { e.preventDefault(); nudge(k); if (k !== 'reset') { clearInterval(hold); hold = setInterval(function () { nudge(k); }, 40); } });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b2.addEventListener(ev, function () { clearInterval(hold); }); });
    b2.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(k); } });
  });

  /* ---- cue list collapse (collapsed by default on phones) ---- */
  var cl = box.querySelector('[data-cl]'), tog = box.querySelector('.stg-cl-tog');
  function setCL(on) { cl.classList.toggle('min', !on); box.classList.toggle('cl-open', on); tog.setAttribute('aria-expanded', on); tog.textContent = on ? '▾' : '▸'; }
  box.querySelector('.stg-cl-bar').addEventListener('click', function () { setCL(cl.classList.contains('min')); });
})();
