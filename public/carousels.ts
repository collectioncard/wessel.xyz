// Enhance semantic galleries without making their images depend on JavaScript.
export function enhanceCarousels(root=document) {
for (const gallery of root.querySelectorAll('figure[data-carousel]')) {
 const slides=[...gallery.querySelectorAll<HTMLElement>(':scope > div[data-slide]')];
 if(slides.length<2)continue;
 let current=0;
 const controls=document.createElement('nav'); controls.className='carousel-controls';
 const prev=document.createElement('button'),next=document.createElement('button'),status=document.createElement('span');
 prev.textContent='←';prev.setAttribute('aria-label','Previous image');next.textContent='→';next.setAttribute('aria-label','Next image');status.setAttribute('aria-live','polite');
 controls.append(prev,status,next);gallery.append(controls);
 function show(index){current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>slide.hidden=i!==current);status.textContent=`${current+1} / ${slides.length}`;}
 prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);show(0);
}

}
enhanceCarousels();
