'use strict';
const stage=document.getElementById('stage');
const layers=[document.getElementById('background'),document.getElementById('swarm'),document.getElementById('defense')];
const motion=document.getElementById('motion');
const menuToggle=document.getElementById('show-menu');
const strength=document.getElementById('strength');
const settings=document.getElementById('settings');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
motion.checked=!reduced.matches;
reduced.addEventListener('change',event=>{motion.checked=!event.matches});
let pointerInside=false,targetX=0,targetY=0,x=0,y=0,frameId=null,assetsReady=false;
stage.addEventListener('pointermove',event=>{
  const box=stage.getBoundingClientRect();
  pointerInside=true;
  targetX=Math.max(-1,Math.min(1,((event.clientX-box.left)/box.width-.5)*2));
  targetY=Math.max(-1,Math.min(1,((event.clientY-box.top)/box.height-.5)*2));
});
function releasePointer(){pointerInside=false}
stage.addEventListener('pointerleave',releasePointer);
stage.addEventListener('pointercancel',releasePointer);
stage.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')releasePointer()});
function setMenu(visible){menuToggle.checked=visible;stage.classList.toggle('hide-menu',!visible)}
menuToggle.addEventListener('change',()=>setMenu(menuToggle.checked));
document.getElementById('view-art').addEventListener('click',()=>{setMenu(false);menuToggle.focus()});
document.getElementById('options').addEventListener('click',()=>settings.showModal());
strength.addEventListener('input',()=>{document.getElementById('strength-value').value=Number(strength.value).toFixed(1)+'×'});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!settings.open)setMenu(true)});
function frame(time){
  const factor=Number(strength.value);
  const px=motion.checked?(pointerInside?targetX:Math.sin(time/9500)*.32)*factor:0;
  const py=motion.checked?(pointerInside?targetY:Math.cos(time/11000)*.18)*factor:0;
  x+=(px-x)*.035;y+=(py-y)*.035;
  layers[0].style.transform='translate('+x*.15+'%, '+y*.1+'%)';
  layers[1].style.transform='translate('+x*.45+'%, '+y*.22+'%)';
  layers[2].style.transform='translate('+x*.8+'%, '+y*.38+'%)';
  frameId=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(frameId);frameId=null}
  else if(assetsReady&&frameId===null)frameId=requestAnimationFrame(frame);
});
let loaded=0;
Promise.all(layers.map(async image=>{
  await image.decode();
  loaded++;
  document.getElementById('load-status').textContent='ЗАГРУЗКА СЦЕНЫ / '+loaded+' из 3';
})).then(()=>{
  assetsReady=true;
  document.getElementById('loader').classList.add('ready');
  document.getElementById('loader').setAttribute('aria-hidden','true');
  if(!document.hidden&&frameId===null)frameId=requestAnimationFrame(frame);
}).catch(()=>{
  document.getElementById('loader').classList.add('failed');
  const message=document.getElementById('load-status');
  message.textContent='Не удалось загрузить сцену. ';
  const retry=document.createElement('button');retry.type='button';retry.textContent='Повторить';retry.addEventListener('click',()=>location.reload());message.append(retry);
});
