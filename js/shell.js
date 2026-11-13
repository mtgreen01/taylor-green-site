/* taylor.green shared shell: timecode, cue tracking, nav */
(function(){
  var hdr=document.querySelector('.hdr');
  if(!hdr) return;

  // SMPTE timecode @30fps. LOCAL = free-run from page load; GLOBAL = visitor's system clock (time of day)
  var tcs=document.querySelectorAll('[data-tc]'), tc=tcs[0], t0=performance.now(), raf=0, mode='local';
  try{ if(localStorage.getItem('tcMode')==='global') mode='global' }catch(e){}
  var tag=document.createElement('button'); tag.type='button'; tag.className='tc-tag'; tag.title='Switch timecode: local / global';
  tag.addEventListener('click',function(){ setMode(mode==='global'?'local':'global') });
  var htc=hdr.querySelector('[data-tc]'); if(htc) htc.parentNode.insertBefore(tag,htc);
  var btns=document.querySelectorAll('[data-tc-mode]');
  function setMode(m){
    mode=m; tag.textContent=m==='global'?'GLOBAL':'LOCAL'; tag.setAttribute('aria-label','Timecode source: '+m+'. Click to switch');
    for(var i=0;i<btns.length;i++){ var on=btns[i].getAttribute('data-tc-mode')===m; btns[i].classList.toggle('on',on); btns[i].setAttribute('aria-pressed',on) }
    try{ localStorage.setItem('tcMode',m) }catch(e){}
  }
  for(var i=0;i<btns.length;i++) btns[i].addEventListener('click',function(){ setMode(this.getAttribute('data-tc-mode')) });
  setMode(mode);
  function p(n){return n<10?'0'+n:''+n}
  function tick(now){
    var f;
    if(mode==='global'){ var d=new Date(); f=((d.getHours()*60+d.getMinutes())*60+d.getSeconds())*30+Math.floor(d.getMilliseconds()*.03) }
    else f=Math.floor((now-t0)/1000*30);
    var ff=f%30, s=Math.floor(f/30);
    var v=p(Math.floor(s/3600))+':'+p(Math.floor(s/60)%60)+':'+p(s%60)+':'+p(ff);
    for(var i=0;i<tcs.length;i++) tcs[i].textContent=v;
    raf=requestAnimationFrame(tick);
  }
  function start(){ if(tc && !raf && !document.hidden) raf=requestAnimationFrame(tick) }
  function stop(){ if(raf){cancelAnimationFrame(raf);raf=0} }
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start()});
  start();

  // big name on the landing view (home), small once you scroll
  if(document.body.classList.contains('home')){
    var bigRaf=0;
    function bigName(){ bigRaf=0; hdr.classList.toggle('big', window.scrollY < Math.max(160, innerHeight*.35)*.6) }
    addEventListener('scroll',function(){ if(!bigRaf) bigRaf=requestAnimationFrame(bigName) },{passive:true});
    bigName();
  }

  // scroll progress line
  var bar=document.createElement('div'); bar.className='hdr-progress'; bar.setAttribute('aria-hidden','true'); hdr.appendChild(bar);
  var pRaf=0;
  var goal=document.getElementById('selected');   // home: fills on the way to Featured work
  function prog(){
    pRaf=0;
    var max = goal ? goal.getBoundingClientRect().top + scrollY - hdr.offsetHeight : document.documentElement.scrollHeight-innerHeight;
    bar.style.transform='scaleX('+(max>0?Math.max(0,Math.min(1,scrollY/max)):1)+')';
  }
  addEventListener('scroll',function(){ if(!pRaf) pRaf=requestAnimationFrame(prog) },{passive:true});
  addEventListener('resize',prog); addEventListener('load',prog); prog();

  // cue tracking
  var cue=hdr.querySelector('[data-cue-label]'), secs=document.querySelectorAll('section[data-cue]');
  function setCue(el){ cue.textContent='CUE '+el.dataset.cue+(el.dataset.cueName?' — '+el.dataset.cueName.toUpperCase():'') }
  if(cue && secs.length){
    setCue(secs[0]);
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting) setCue(e.target) });
      },{rootMargin:'-45% 0px -50% 0px'});
      secs.forEach(function(s){io.observe(s)});
    }
  }

  // active nav
  var nav=hdr.querySelector('.hdr-nav'), path=location.pathname;
  var key=/\/work\//.test(path)?'work':/about(\.html)?\/?$/.test(path)?'about':/contact(\.html)?\/?$/.test(path)?'contact':null;
  if(nav && key) nav.querySelectorAll('a').forEach(function(a){
    if(a.textContent.trim().toLowerCase()===key) a.setAttribute('aria-current','page');
  });

  // mobile nav
  if(nav){
    if(!nav.id) nav.id='hdr-nav';
    var b=document.createElement('button');
    b.className='hdr-toggle'; b.type='button'; b.textContent='Menu';
    b.setAttribute('aria-expanded','false'); b.setAttribute('aria-controls',nav.id);
    hdr.insertBefore(b,nav);
    function setOpen(o){nav.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.textContent=o?'Close':'Menu'}
    b.addEventListener('click',function(){setOpen(!nav.classList.contains('open'))});
    nav.addEventListener('click',function(e){ if(e.target.tagName==='A') setOpen(false) });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') setOpen(false) });
  }

  // footer year
  document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
