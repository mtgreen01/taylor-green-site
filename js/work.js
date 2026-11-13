/* Show pages: horizontal gallery rail + lightbox. Everything reacts to the visitor only. */
(function () {
  var gal = document.querySelector('[data-gal]');
  var items = [].slice.call(document.querySelectorAll('[data-lb]'));
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---- gallery rail ---- */
  if (gal) {
    var rail = gal.querySelector('[data-gal-rail]'), out = gal.querySelector('[data-gal-i]'), bar = gal.querySelector('[data-gal-bar]');
    var cur = 0, raf = 0;
    function update() {
      raf = 0;
      var left = rail.getBoundingClientRect().left, best = 0, bd = 1e9;
      items.forEach(function (a, i) { var d = Math.abs(a.getBoundingClientRect().left - left - parseFloat(getComputedStyle(rail).scrollPaddingLeft || 0)); if (d < bd) { bd = d; best = i; } });
      var max = rail.scrollWidth - rail.clientWidth;
      if (max > 0 && rail.scrollLeft >= max - 4) best = items.length - 1;
      cur = best; out.textContent = pad(cur + 1);
      bar.style.transform = 'scaleX(' + (max > 0 ? rail.scrollLeft / max : 1) + ')';
      items.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    }
    function go(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      var a = items[i], pl = parseFloat(getComputedStyle(rail).scrollPaddingLeft || 0);
      rail.scrollTo({ left: a.offsetLeft - rail.offsetLeft - pl, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    rail.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    gal.querySelector('[data-gal-prev]').addEventListener('click', function () { go(cur - 1); });
    gal.querySelector('[data-gal-next]').addEventListener('click', function () { go(cur + 1); });
    rail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    // mouse drag to scroll (touch already swipes natively)
    var dragX = null, startL = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; dragX = e.clientX; startL = rail.scrollLeft; moved = false; rail.classList.add('drag'); });
    addEventListener('pointermove', function (e) { if (dragX === null) return; var dx = e.clientX - dragX; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = startL - dx; });
    addEventListener('pointerup', function () { if (dragX === null) return; dragX = null; rail.classList.remove('drag'); });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    update();
  }

  /* ---- lightbox with prev / next ---- */
  var lb = document.querySelector('.lb'); if (!lb || !items.length) return;
  var img = lb.querySelector('img'), count = lb.querySelector('[data-lb-count]'), at = 0, last = null;
  function show(i) {
    at = (i + items.length) % items.length; var a = items[at];
    img.src = a.getAttribute('href'); img.alt = a.querySelector('img').alt;
    if (count) count.textContent = pad(at + 1) + ' / ' + pad(items.length);
  }
  function close() { lb.hidden = true; img.removeAttribute('src'); document.body.style.overflow = ''; if (last) last.focus(); }
  items.forEach(function (a, i) {
    a.addEventListener('click', function (e) { e.preventDefault(); last = a; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); });
  });
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(at - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(at + 1); });
  img.addEventListener('click', function (e) { e.stopPropagation(); show(at + 1); });
  lb.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(at + 1); else if (e.key === 'ArrowLeft') show(at - 1);
  });
})();
