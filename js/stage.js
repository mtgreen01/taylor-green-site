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
    '<div class="stg-foot"><span class="g">● main</span><span data-stg-res></span><span>drag to orbit</span><span data-stg-tc></span></div>';
  document.body.appendChild(box);

  var view = box.querySelector('.stg-view'), world = box.querySelector('.stg-world');
  var res = box.querySelector('[data-stg-res]'), tcOut = box.querySelector('[data-stg-tc]');
  var ry = -14, rx = -18, z = -6200, last = null, before = null, raf = 0;

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

  function open() {
    var hero = document.querySelector('[data-hero-img]');
    var src = hero ? hero.currentSrc || hero.src : '';
    var pics = [];
    (window.SHOWS || []).forEach(function (sh) { (sh.photos || []).slice(0, 2).forEach(function (p) { if (p.src !== src) pics.push(p.src); }); });
    if (src) walls[0].style.backgroundImage = 'url("' + src + '")';
    if (pics[0]) walls[1].style.backgroundImage = 'url("' + pics[1] + '")';
    if (pics[1]) walls[2].style.backgroundImage = 'url("' + pics[3] + '")';
    res.textContent = 'main 1800 × 660  ·  imag 560 × 315';
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
  view.addEventListener('pointerdown', function (e) { last = [e.clientX, e.clientY]; view.setPointerCapture(e.pointerId); view.classList.add('drag'); });
  view.addEventListener('pointermove', function (e) {
    if (!last) return;
    ry += (e.clientX - last[0]) * .2; rx = Math.max(-70, Math.min(-3, rx - (e.clientY - last[1]) * .2));
    last = [e.clientX, e.clientY]; apply();
  });
  function up() { last = null; view.classList.remove('drag'); }
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', function (e) { e.preventDefault(); z = Math.max(-5000, Math.min(400, z - e.deltaY * 1.2)); apply(); }, { passive: false });
})();
