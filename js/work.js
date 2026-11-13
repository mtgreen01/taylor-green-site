(function(){
  var lb=document.querySelector('.lb'); if(!lb) return;
  var img=lb.querySelector('img'), last=null;
  function close(){lb.hidden=true;img.removeAttribute('src');document.body.style.overflow='';if(last)last.focus()}
  document.querySelectorAll('[data-lb]').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();last=a;img.src=a.getAttribute('href');img.alt=a.querySelector('img').alt;
      lb.hidden=false;document.body.style.overflow='hidden';lb.querySelector('.lb-close').focus();
    });
  });
  lb.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)close()});
})();
