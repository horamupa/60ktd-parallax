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
const scenes={
  brutal:{directory:'assets/',master:'source/master-art.png',study:'02',caption:'Тяжёлая оборона. Биомеханический рой. Два независимых слоя и неподвижное меню.'},
  comic:{directory:'assets/comic/',master:'source/comic/master-art.png',study:'01',caption:'Первая комиксная версия. Бирюзовые башни и фиолетовый рой. Два независимых слоя и неподвижное меню.'}
};
const filenames=['00-background.png','02-swarm-right.png','01-defense-left.png'];
const versionButtons=Array.from(document.querySelectorAll('[data-scene]'));
const sceneCache=new Map();
let sceneRequest=0;
async function loadScene(key){
  if(!Object.hasOwn(scenes,key))return;
  const request=++sceneRequest,scene=scenes[key],loader=document.getElementById('loader'),message=document.getElementById('load-status');
  loader.classList.remove('ready','failed');loader.removeAttribute('aria-hidden');stage.setAttribute('aria-busy','true');
  message.textContent='ЗАГРУЗКА СЦЕНЫ / '+scene.study;
  versionButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===key)));
  try{
    if(!sceneCache.has(key)){
      const promise=Promise.all(filenames.map(async filename=>{
        const image=new Image();image.src=scene.directory+filename;await image.decode();return image;
      }));
      sceneCache.set(key,promise);
      promise.catch(()=>{if(sceneCache.get(key)===promise)sceneCache.delete(key)});
    }
    const images=await sceneCache.get(key);
    if(request!==sceneRequest)return;
    layers.forEach((layer,index)=>{layer.src=images[index].src});
    await Promise.all(layers.map(image=>image.decode()));
    if(request!==sceneRequest)return;
    assetsReady=true;stage.removeAttribute('aria-busy');
    document.getElementById('study-label').textContent='PARALLAX STUDY · '+scene.study;
    document.getElementById('caption').textContent=scene.caption;
    document.getElementById('master-link').href=scene.master;
    loader.classList.add('ready');loader.setAttribute('aria-hidden','true');
    history.replaceState(null,'','#'+key);
    if(!document.hidden&&frameId===null)frameId=requestAnimationFrame(frame);
  }catch(error){
    if(request!==sceneRequest)return;
    stage.removeAttribute('aria-busy');loader.classList.add('failed');
    message.textContent='Не удалось загрузить сцену. ';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Повторить';retry.addEventListener('click',()=>loadScene(key));message.append(retry);
  }
}
versionButtons.forEach(button=>button.addEventListener('click',()=>loadScene(button.dataset.scene)));
window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(Object.hasOwn(scenes,key))loadScene(key)});
loadScene(location.hash==='#comic'?'comic':'brutal');
