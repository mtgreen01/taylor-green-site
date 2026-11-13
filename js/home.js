/* Home page: intro, hero beam, selected work, cue-sheet work list. Built from window.SHOWS. */
(function () {
  'use strict';
  var SHOWS = window.SHOWS || [];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function title(s) { return s.artist + (s.show ? ' — ' + s.show : ''); }
  function href(s) { return 'work/' + s.slug + '.html'; }
  var yr = document.querySelector('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- 0. intro (once per session) ---------- */
  (function intro() {
    var box = document.getElementById('intro'); if (!box) return;
    var seen = false;
    try { seen = sessionStorage.getItem('introSeen') === '1'; sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    if (seen) { box.classList.add('done'); return; }
    var mark = box.querySelector('.mark');
    var CAP = 499, PITCH = 60.5, N = 9, anims = [], over = false;
    var widths = []; for (var i = 0; i < N; i++) widths.push(13 + i * (47 - 13) / (N - 1));
    function finish() {
      if (over) return; over = true;
      anims.forEach(function (a) { a.cancel(); });
      box.classList.add('done');
      removeEventListener('keydown', finish);
    }
    box.addEventListener('click', finish);
    addEventListener('keydown', finish);
    if (!box.animate) { finish(); return; }
    var h = mark.getBoundingClientRect().height || 160, u = h / CAP;
    mark.style.width = ((N - 1) * PITCH + widths[N - 1]) * u + 'px';
    widths.forEach(function (w, i) {
      var b = el('div', 'bar');
      b.style.cssText = 'position:absolute;top:0;bottom:0;left:' + i * PITCH * u + 'px;width:' + w * u + 'px';
      mark.appendChild(b);
    });
    if (reduce) {
      mark.querySelectorAll('.bar').forEach(function (b) { b.style.transform = 'none'; });
      var f = box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 300, fill: 'forwards' });
      anims.push(f); f.onfinish = finish; return;
    }
    for (var t = 0; t < 14; t++) box.appendChild(el('div', 'trail'));
    var bars = [].slice.call(mark.children), trails = [].slice.call(box.querySelectorAll('.trail'));
    var T2 = 1050, FLY = 900;
    bars.forEach(function (b, i) {
      anims.push(b.animate([{ transform: 'scaleY(0)', opacity: .2 }, { transform: 'scaleY(1)', opacity: 1 }],
        { duration: 420, delay: i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
    });
    anims.push(mark.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)', offset: .25 }, { transform: 'scale(16)' }],
      { duration: FLY, delay: T2, easing: 'cubic-bezier(.7,0,.84,0)', fill: 'forwards' }));
    bars.forEach(function (b, i) {
      var dir = i - (N - 1) / 2;
      anims.push(b.animate([{ transform: 'scaleY(1) translateX(0)', opacity: 1 }, { transform: 'scaleY(3) translateX(' + dir * 40 + 'px)', opacity: 0 }],
        { duration: FLY, delay: T2, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards', composite: 'replace' }));
    });
    trails.forEach(function (t, i) {
      var x = (i % 2 ? 1 : -1) * (8 + Math.random() * 46);
      anims.push(t.animate([
        { opacity: 0, transform: 'translate(-50%,-50%) scaleY(.1)' },
        { opacity: .9, transform: 'translate(-50%,-50%) scaleY(.6)', offset: .3 },
        { opacity: 0, transform: 'translate(calc(-50% + ' + x + 'vw),-50%) scaleY(1.2)' }],
        { duration: FLY * .9, delay: T2 + 120 + Math.random() * 180, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' }));
    });
    var out = box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: T2 + FLY - 250, fill: 'forwards' });
    anims.push(out); out.onfinish = finish;
  })();

  /* ---------- 1.0 hero: disguise-style timeline scrub ---------- */
  (function hero() {
    var tl = document.querySelector('[data-tl]'); if (!tl) return;
    var img = document.querySelector('[data-hero-img]'), track = tl.querySelector('[data-tl-track]');
    var clipsBox = tl.querySelector('[data-tl-clips]'), ruler = tl.querySelector('[data-tl-ruler]'), head = tl.querySelector('[data-tl-head]');
    var showEl = tl.querySelector('[data-tl-show]'), tcEl = tl.querySelector('[data-tl-tc]');
    var shows = SHOWS.filter(function (s) { return s.featured && s.photos && s.photos.length; });
    var frames = [], SEC_PER_FRAME = 4, FPS = 30;
    shows.forEach(function (s, si) {
      s.photos.slice(0, 4).forEach(function (p) { frames.push({ s: s, si: si, p: p }); });
    });
    if (!frames.length) return;
    var N = frames.length, cur = -1, pos = 0;
    // clips (one per show, width proportional to its frames)
    var clipEls = shows.map(function (s, si) {
      var n = frames.filter(function (f) { return f.si === si; }).length;
      var c = el('div', 'tl-clip'); c.style.flex = n;
      var go = el('a', 'tl-go', '[GO]'); go.href = href(s); go.setAttribute('aria-label', 'Go to ' + title(s));
      go.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      c.appendChild(go); c.appendChild(el('span', 'tl-clip-t', title(s)));
      clipsBox.appendChild(c); return c;
    });
    // ruler: tick per frame, cue marker at each show start
    function tc(sec) { var f = Math.round(sec * FPS), p = function (n) { return (n < 10 ? '0' : '') + n; };
      return p(Math.floor(f / 108000)) + ':' + p(Math.floor(f / 1800) % 60) + ':' + p(Math.floor(f / 30) % 60) + ':' + p(f % 30); }
    frames.forEach(function (f, i) {
      var t = el('div', 'tl-tick'); t.style.left = (i / N * 100) + '%';
      if (i === 0 || frames[i - 1].si !== f.si) { t.classList.add('cue'); t.appendChild(el('span', '', 'CUE 1.' + (f.si + 1))); }
      ruler.appendChild(t);
    });
    // preload
    // preload the other frames only once someone starts scrubbing (keeps first load light)
    var warmed = false;
    function warm() { if (warmed) return; warmed = true; frames.forEach(function (f) { var i = new Image(); i.src = f.p.src; }); }
    ['pointerenter', 'touchstart', 'focusin'].forEach(function (ev) { tl.parentNode.addEventListener(ev, warm, { passive: true, once: true }); });
    function render() {
      var i = Math.min(N - 1, Math.floor(pos * N));
      head.style.left = (pos * 100) + '%';
      tcEl.textContent = tc(pos * N * SEC_PER_FRAME);
      ruler.setAttribute('aria-valuenow', Math.round(pos * 100));
      if (i === cur) return; cur = i;
      var f = frames[i]; img.src = f.p.src; img.alt = title(f.s);
      showEl.textContent = 'CUE 1.' + (f.si + 1) + ' — ' + title(f.s);
      clipEls.forEach(function (c, k) { c.classList.toggle('on', k === f.si); });
    }
    function at(clientX) { var r = track.getBoundingClientRect(); pos = Math.max(0, Math.min(.9999, (clientX - r.left) / r.width)); render(); }
    var dragging = false;
    var narrow = matchMedia('(max-width:640px)');
    track.addEventListener('pointerdown', function (e) {
      // phones: the clips are a stacked list — tapping a row cues that show
      var clip = narrow.matches && e.target.closest && e.target.closest('.tl-clip');
      if (clip) { var k = clipEls.indexOf(clip); for (var i = 0; i < N; i++) if (frames[i].si === k) { pos = (i + .5) / N; break; } render(); return; }
      dragging = true; track.setPointerCapture(e.pointerId); at(e.clientX);
    });
    track.addEventListener('pointermove', function (e) { if (dragging) at(e.clientX); });
    track.addEventListener('pointerup', function () { dragging = false; });
    // desktop: moving left/right across the hero also scrubs
    if (matchMedia('(hover: hover)').matches) {
      tl.parentNode.addEventListener('pointermove', function (e) { if (!dragging && e.pointerType === 'mouse') at(e.clientX); });
    }
    ruler.addEventListener('keydown', function (e) {
      var step = 1 / N;
      if (e.key === 'ArrowRight') pos = Math.min(.9999, pos + step);
      else if (e.key === 'ArrowLeft') pos = Math.max(0, pos - step);
      else if (e.key === 'Home') pos = 0; else if (e.key === 'End') pos = .9999; else return;
      e.preventDefault(); render();
    });
    render();
  })();

  /* ---------- 2.0 selected work: MA-style cue sheet ---------- */
  (function featured() {
    var box = document.querySelector('[data-featured]'); if (!box) return;
    function row(cls, cells, tag) { var r = el(tag || 'div', 'ma-row ' + (cls || '')); cells.forEach(function (c) { r.appendChild(c); }); box.appendChild(r); return r; }
    function cell(cls, txt) { return el('span', cls, txt); }
    row('ma-head', [cell('ma-n', 'No'), cell('', 'Name'), cell('', 'Year'), cell('', 'Role'), cell('', 'Preview')]);
    row('ma-off', [cell('ma-n', '0'), cell('', 'CueZero'), cell('', ''), cell('', ''), cell('', '')]).setAttribute('aria-hidden', 'true');
    SHOWS.filter(function (s) { return s.featured; }).forEach(function (s, i) {
      var th = cell('ma-th');
      if (s.photos && s.photos[0]) { var im = el('img'); im.src = s.photos[0].thumb; im.alt = ''; im.loading = 'lazy'; th.appendChild(im); }
      var r = row('', [cell('ma-n', '2.' + (i + 1)), cell('ma-name', title(s)), cell('', String(s.year)), cell('', s.role.toUpperCase()), th], 'a');
      r.href = href(s); r.setAttribute('role', 'listitem');
    });
    row('ma-off', [cell('ma-n', ''), cell('', 'OffCue'), cell('', ''), cell('', ''), cell('', '')]).setAttribute('aria-hidden', 'true');
  })();

  /* ---------- hero timecode fades out on scroll; header readout fades in ---------- */
  (function fade() {
    var big = document.querySelector('.hero-copy'), body = document.body, raf = 0;
    if (!big) return;
    function update() {
      raf = 0;
      var D = Math.max(160, window.innerHeight * .35), p = Math.min(1, window.scrollY / D);
      big.style.opacity = reduce ? (p < .5 ? 1 : 0) : 1 - p;
      big.style.visibility = p >= 1 ? 'hidden' : '';
    }
    function req() { if (!raf) raf = requestAnimationFrame(update); }
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); req();
  })();

  /* ---------- 3.0 discipline filter (desktop: one line of text filters; phone: a dropdown) ---------- */
  function buildFilter(box) {
    var NAMES = ['Technical direction', 'Show + systems design', 'Media server programming', 'Lighting programming', 'Screens producing'];
    var rows = [].slice.call(box.querySelectorAll('.cue'));
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var count = function (n) { return n ? SHOWS.filter(function (s) { return (s.disciplines || []).indexOf(n) > -1; }).length : SHOWS.length; };
    var wrap = el('div', 'disc'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', 'Filter work by discipline');
    var tog = el('button', 'disc-tog'); tog.type = 'button'; tog.setAttribute('aria-expanded', 'false');
    var list = el('div', 'disc-list');
    function label(n) { tog.innerHTML = ''; tog.appendChild(el('span', 'disc-cur', 'Filter: ' + (n || 'All'))); tog.appendChild(el('em', '', p2(count(n)) + ' ▾')); }
    function pick(n, btn) {
      list.querySelectorAll('.disc-k').forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true');
      rows.forEach(function (r, i) {
        var show = !n || (SHOWS[i].disciplines || []).indexOf(n) > -1;
        r.classList.toggle('is-hidden', !show);
        if (!show && r.classList.contains('open')) r.querySelector('.cue-btn').click();
      });
      label(n); wrap.classList.remove('open'); tog.setAttribute('aria-expanded', 'false');
    }
    [''].concat(NAMES).forEach(function (n, i) {
      var b = el('button', 'disc-k' + (i ? '' : ' on')); b.type = 'button'; b.setAttribute('aria-pressed', i ? 'false' : 'true');
      b.appendChild(document.createTextNode(n || 'All')); b.appendChild(el('sup', '', p2(count(n))));
      if (!count(n)) b.disabled = true;
      b.addEventListener('click', function () { pick(n, b); });
      list.appendChild(b);
    });
    tog.addEventListener('click', function () { var o = wrap.classList.toggle('open'); tog.setAttribute('aria-expanded', o); });
    label(''); wrap.appendChild(tog); wrap.appendChild(list);
    box.parentNode.insertBefore(wrap, box);
  }

  /* ---------- 3.0 work list ---------- */
  (function list() {
    var box = document.querySelector('[data-cues]'); if (!box) return;
    var open = null, lastYear = null;
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function close(row) {
      if (!row) return; row.classList.remove('open');
      row.querySelector('.cue-btn').setAttribute('aria-expanded', 'false');
      row.querySelector('.cue-panel').setAttribute('aria-hidden', 'true');
      row.querySelectorAll('.cue-panel a').forEach(function (a) { a.tabIndex = -1; });
    }
    SHOWS.forEach(function (s, i) {
      var n = '3.' + pad(i + 1), id = 'cue-' + s.slug;
      var row = el('div', 'cue'); row.setAttribute('role', 'listitem');
      if (s.year !== lastYear) { row.classList.add('yr-start'); lastYear = s.year; }
      var b = el('button', 'cue-btn cue-cols'); b.type = 'button';
      b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', id);
      b.appendChild(el('span', 'cue-n', n));
      b.appendChild(el('span', 'cue-yr', String(s.year)));
      b.appendChild(el('span', 'cue-t', title(s)));
      b.appendChild(el('span', 'cue-role', s.role));
      var ar = el('span', 'cue-ar', '→'); ar.setAttribute('aria-hidden', 'true'); b.appendChild(ar);
      var panel = el('div', 'cue-panel'); panel.id = id; panel.setAttribute('aria-hidden', 'true');
      var inner = el('div');
      var go = el('a', 'cue-go'); go.href = href(s); go.tabIndex = -1; go.setAttribute('aria-label', 'GO: open ' + title(s));
      go.appendChild(el('span', '', 'GO →')); go.appendChild(el('span', '', 'Cue ' + n)); inner.appendChild(go);
      var has = s.photos && s.photos.length;
      if (has) inner.appendChild(el('div', 'cue-strip'));
      else inner.appendChild(el('p', 'cue-soon', 'Photos coming soon'));
      panel.appendChild(inner);
      row.appendChild(b); row.appendChild(panel); box.appendChild(row);

      b.addEventListener('click', function () {
        if (open === row) { close(row); open = null; return; }
        close(open); open = row;
        var strip = row.querySelector('.cue-strip');
        if (strip && !strip.childElementCount) {
          s.photos.forEach(function (p, k) {
            var im = el('img'); im.src = p.thumb; im.loading = 'lazy'; im.decoding = 'async';
            im.alt = title(s) + ' — photo ' + (k + 1); im.width = p.w; im.height = p.h; strip.appendChild(im);
          });
        }
        row.classList.add('open'); b.setAttribute('aria-expanded', 'true'); panel.setAttribute('aria-hidden', 'false');
        go.tabIndex = 0;
      });
    });
    buildFilter(box);
  })();
})();
