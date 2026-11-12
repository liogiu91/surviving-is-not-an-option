import {
  giantessSprite, officeShoeSprite, officeTwistSprite,
  officeDefeatImage, gymDefeatImage, classroomDefeatImage, poolDefeatImage,
  OFFICE_FRAME_W, OFFICE_FRAME_H, OFFICE_TWIST_FRAME_W, OFFICE_TWIST_FRAME_H, OFFICE_TWIST_FRAMES,
  classroomShoeSprite, classroomInspectionExtendedSprite,
  CLASSROOM_FRAME_W, CLASSROOM_FRAME_H,
  CLASSROOM_FINISHER_FRAME_W, CLASSROOM_FINISHER_FRAME_H, CLASSROOM_FINISHER_FRAMES,
  classroomFinisherSprite, GIANTESS_FRAMES, GIANTESS_FRAME_W, GIANTESS_FRAME_H,
  heroSprite, HERO_CELL, impactFX, puddleFX, stickyBloodFX,
  STICKY_BLOOD_FRAME_W, STICKY_BLOOD_FRAME_H, STICKY_BLOOD_FRAMES,
  FX_IMPACT_W, FX_POOL_W,
  gymBackground, officeBackground, classroomBackground,
  classroomBloodDragSprite, CLASSROOM_BLOOD_FRAME_W, CLASSROOM_BLOOD_FRAME_H,
  poolBackground, poolWedgeSprite, POOL_FRAME_W, POOL_FRAME_H, POOL_FRAMES,
  poolFinisherSprite, POOL_FINISHER_FRAME_W, POOL_FINISHER_FRAME_H, POOL_FINISHER_FRAMES
} from './assets.js';
import { W, H, WORLD_W, difficulties, MAX_STAMINA, clamp } from './config.js';
import { SaveManager } from './saveManager.js';
import { gymLevel } from './levels/gym.js';
import { officeLevel } from './levels/office.js';
import { classroomLevel } from './levels/classroom.js';
import { poolLevel } from './levels/pool.js';

(() => {
const canvas=document.getElementById('c'), ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');


let cameraX=0;
const keys={}; let sprintHeld=false; let running=false, dead=false, startTime=0, last=0, elapsed=0, best=0;
let player, shoe, particles=[], stain=null, deathTimer=0, flash=0, safeTime=0, stepCount=0;
let defeatPhase='none', defeatTimer=0;
let victoryPhase='none', victoryTimer=0;
let difficulty=SaveManager.getDifficulty(), maxHp=3, hp=3;
let selectedLevel=SaveManager.getSelectedLevel();
let unsavedPlayTime=0;
const LEVELS = {1:gymLevel, 2:officeLevel, 3:classroomLevel, 4:poolLevel};
const getLevel = () => LEVELS[selectedLevel] || gymLevel;
let stamina=MAX_STAMINA, sprintLocked=false;
document.querySelectorAll('[data-level]').forEach(btn=>btn.addEventListener('click',()=>{
 const requestedLevel=Number(btn.dataset.level);
 if(!Number.isInteger(requestedLevel) || requestedLevel<1 || requestedLevel>SaveManager.getUnlockedLevel())return;
 if(!SaveManager.selectLevel(requestedLevel))return;
 selectedLevel=requestedLevel;
 document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('selected',b===btn));
 const title=document.getElementById('menuTitle');
 if(title)title.textContent=getLevel().title;
 const p=overlay.querySelector('p');
 if(p)p.textContent=getLevel().intro;
}));
document.querySelectorAll('[data-diff]').forEach(btn=>btn.addEventListener('click',()=>{
 difficulty=btn.dataset.diff;
 SaveManager.setDifficulty(difficulty);
 document.querySelectorAll('[data-diff]').forEach(b=>b.classList.toggle('selected',b===btn));
}));
function updateHealthUI(){
 const pct=maxHp?hp/maxHp*100:0;
 document.getElementById('healthFill').style.width=pct+'%';
 document.getElementById('healthText').textContent=hp+' / '+maxHp;
 document.getElementById('healthFill').style.background=pct<=35?'linear-gradient(90deg,#791c35,#d64c68)':'linear-gradient(90deg,#a52b4d,#f08ba8)';
}
function updateStaminaUI(){
 const pct=stamina/MAX_STAMINA*100;
 const fill=document.getElementById('staminaFill');if(fill){fill.style.width=pct+'%';fill.style.background=sprintLocked?'linear-gradient(90deg,#8f293c,#e45b70)':'linear-gradient(90deg,#c18a42,#f5d58a)';}
 const label=document.getElementById('staminaText');if(label)label.textContent=(sprintLocked?'ESAUSTO · ':'')+Math.ceil(pct)+'%';
}
function reset(){
 maxHp=difficulties[difficulty].hp; hp=maxHp;
 // All levels share the same fixed player lane, aligned to the established Level 3 ground line.
  player={x:475,y:559,r:8,speed:270,inv:0,anim:0,state:'idle',stateT:0};
 stamina=MAX_STAMINA;sprintLocked=false;cameraX=0;
 shoe={x:690,y:270,tx:475,ty:270,phase:'lift',t:0,step:0,scale:1,aimTimer:0,speed:310,aiMode:'hunt',aiModeT:0,aiCooldown:1.8,aiBurst:0,aiTell:0};
 particles=[]; stain=null; deathTimer=0; flash=0; safeTime=0; elapsed=0; stepCount=0; dead=false; defeatPhase='none';defeatTimer=0; victoryPhase='none';victoryTimer=0;
 updateHealthUI();updateStaminaUI();
}
function start(level=selectedLevel){
 const requestedLevel=Math.floor(Number(level));
 // Enforce progression in the gameplay entry point as well as in the UI.
 // A locked level can never start, even if another caller bypasses the menu.
 if(!Number.isInteger(requestedLevel) || requestedLevel<1 || requestedLevel>SaveManager.getUnlockedLevel())return false;
 if(!SaveManager.selectLevel(requestedLevel))return false;
 selectedLevel=requestedLevel;
 difficulty=SaveManager.getDifficulty();
 SaveManager.recordLevelStart(selectedLevel);
 unsavedPlayTime=0;
 document.getElementById('wrap').classList.remove('defeat-sequence-clean');
 sprintHeld=false;keys.shift=false;reset();running=true;startTime=performance.now();last=startTime;overlay.classList.add('hidden');
 overlay.classList.remove('game-over-menu','victory-menu');
 const mainMenu=document.getElementById('mainMenu');if(mainMenu)mainMenu.classList.add('hidden');
 document.getElementById('victoryNext').style.display='none';
 document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.level)===selectedLevel));
 document.querySelectorAll('[data-diff]').forEach(b=>b.classList.toggle('selected',b.dataset.diff===difficulty));
 const subtitle=document.querySelector('header .sub');
 if(subtitle)subtitle.textContent=getLevel().subtitle;
 return true;
}
document.getElementById('start').onclick=()=>start(selectedLevel);
document.getElementById('victoryNext').onclick=()=>{
 const nextLevel=selectedLevel+1;
 if(nextLevel<=SaveManager.getUnlockedLevel())start(nextLevel);
};
document.getElementById('victoryMenu').onclick=()=>window.dispatchEvent(new CustomEvent('siota:show-main-menu'));
window.SIOTA={startLevel:(level)=>start(level),pause:()=>{running=false;}};

// Freeze the complete game simulation whenever the page is hidden. The
// survival clock is based on performance.now(), so shift its origin by the
// hidden duration when the player returns; this prevents background time
// from counting toward a win. The same pause also freezes the victory escape.
let backgroundPaused=false;
let backgroundPauseStartedAt=0;
function clearGameplayInput(){
 Object.keys(keys).forEach(key=>keys[key]=false);
 sprintHeld=false;
 if(typeof activeControlPointers!=='undefined'){
  activeControlPointers.clear();
  if(typeof refreshTouchKeys==='function')refreshTouchKeys();
 }
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  if(!backgroundPaused && (running || victoryPhase==='run')){
   backgroundPaused=true;
   backgroundPauseStartedAt=performance.now();
   clearGameplayInput();
  }
  return;
 }
 if(backgroundPaused){
  const pausedDuration=performance.now()-backgroundPauseStartedAt;
  if(running)startTime+=pausedDuration;
  backgroundPaused=false;
  last=performance.now(); // discard the long frame accumulated while hidden
 }
});
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();if(defeatPhase==='wait'){showGameOver();return;}});
canvas.addEventListener('pointerdown',()=>{if(defeatPhase==='wait')showGameOver();});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
// Robust keyboard + touch input. Pointer capture keeps a held button active
// even if the finger drifts slightly outside its hit area.
// One delegated multi-touch controller for the whole control strip.
// Each finger keeps its own pointerId, so direction + sprint can be held together.
const touchControls=document.getElementById('touchControls');
const activeControlPointers=new Map();
function refreshTouchKeys(){
 keys.a=false;keys.d=false;sprintHeld=false;
 for(const key of activeControlPointers.values()){
  if(key==='shift')sprintHeld=true;
  else keys[key]=true;
 }
 touchControls.querySelectorAll('.touchbtn').forEach(btn=>{
  const held=[...activeControlPointers.values()].includes(btn.dataset.key);
  btn.classList.toggle('pressed',held);
 });
}
if(touchControls){
 // Native Touch Events are used for fingers: Android can track multiple
 // identifiers simultaneously without pointer-capture retargeting issues.
 touchControls.addEventListener('touchstart',e=>{
  for(const t of e.changedTouches){
   const el=document.elementFromPoint(t.clientX,t.clientY);
   const btn=el && el.closest('.touchbtn[data-key]');
   if(btn)activeControlPointers.set('touch-'+t.identifier,btn.dataset.key);
  }
  if([...activeControlPointers.keys()].some(k=>String(k).startsWith('touch-')))e.preventDefault();
  refreshTouchKeys();
 },{passive:false});
 const endTouches=e=>{
  for(const t of e.changedTouches)activeControlPointers.delete('touch-'+t.identifier);
  e.preventDefault();refreshTouchKeys();
 };
 touchControls.addEventListener('touchend',endTouches,{passive:false});
 touchControls.addEventListener('touchcancel',endTouches,{passive:false});
 // Mouse/pen support without interfering with native touch handling.
 touchControls.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;
  const btn=e.target.closest('.touchbtn[data-key]');if(!btn)return;
  activeControlPointers.set('pointer-'+e.pointerId,btn.dataset.key);
  try{btn.setPointerCapture(e.pointerId);}catch(_){}
  refreshTouchKeys();
 });
 const endPointer=e=>{
  if(e.pointerType==='touch')return;
  if(activeControlPointers.delete('pointer-'+e.pointerId))refreshTouchKeys();
 };
 touchControls.addEventListener('pointerup',endPointer);
 touchControls.addEventListener('pointercancel',endPointer);
 touchControls.addEventListener('lostpointercapture',endPointer);
}
window.addEventListener('pagehide',()=>{if(unsavedPlayTime>0){SaveManager.addPlayTime(unsavedPlayTime);unsavedPlayTime=0;}});
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);sprintHeld=false;activeControlPointers.clear();document.querySelectorAll('.touchbtn').forEach(b=>b.classList.remove('pressed','active-sprint'));});
function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}

function drawFloor(cam=0){
  // La palestra originale resta invariata; il secondo livello usa soltanto il nuovo fondale ufficio.
  const bg = getLevel().id===4 ? poolBackground : getLevel().id===3 ? classroomBackground : getLevel().id===2 ? officeBackground : gymBackground;
  if (bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, -cam, 0, WORLD_W, H);
  } else {
    ctx.fillStyle = '#29384d';
    ctx.fillRect(-cam, 0, WORLD_W, H);
  }
}
function drawPlayer(){ if(!player || dead || player.state==='squashed')return; if(player.inv>0 && Math.floor(performance.now()/90)%2===0)return;
 const x=player.x,y=player.y,moving=Math.abs(player.moveVX||0)>1,sprint=!!player.sprinting;
 let row=0,frame=0;
 if(player.state==='fall'){row=3;frame=Math.min(4,Math.floor(player.stateT*8));}
 else if(moving){row=sprint?2:1;frame=Math.floor(player.anim*(sprint?13:8))%8;}
 else {row=0;frame=Math.floor(performance.now()/260)%6;}
 // Build 3.3: character enlarged to read clearly against the giant foot.
 const playerScale=1.62;
 const w=(player.state==='squashed'?82:player.state==='fall'?68:58)*playerScale;
 const h=(player.state==='squashed'?38:player.state==='fall'?66:76)*playerScale;
 ctx.save();ctx.translate(x,y);if(player.facing===-1)ctx.scale(-1,1);
 // Player ground shadow removed: only the giant shoe keeps its projected shadow.
 if(heroSprite.complete&&heroSprite.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(heroSprite,frame*HERO_CELL,row*HERO_CELL,HERO_CELL,HERO_CELL,-w/2,-h+4,w,h);}
 else{ctx.fillStyle='#293b53';ctx.fillRect(-5,-25,10,22);}
 ctx.restore();
}

function drawFootShadow(x,groundY,angle,progress=0){
 const p=clamp(progress,0,1);
 const width=160+92*p;
 const depth=22+34*p;
 const alpha=.12+.43*p;
 const pulse=1+.018*Math.sin(performance.now()/115);
 ctx.save();
 ctx.translate(x,groundY);
 ctx.rotate(angle);
 ctx.globalAlpha=alpha;
 ctx.fillStyle='#100c16';
 ctx.beginPath();
 ctx.ellipse(0,0,width*pulse,depth*pulse,0,0,Math.PI*2);
 ctx.fill();
 ctx.restore();
}
function shoeFacesRight(){
 // During the attack, keep the direction captured when the foot begins to descend.
 // The same locked direction is preserved while the foot is planted and during recovery.
 if(shoe && typeof shoe.attackFacesRight==='boolean' &&
    (dead || shoe.phase==='drop' || shoe.phase==='press' || (shoe.phase==='lift' && shoe.recovering))){
   return shoe.attackFacesRight;
 }
 const targetX=player?.x??shoe?.x??0;
 return selectedLevel===4 ? targetX<shoe.x : targetX>shoe.x;
}
function shoeShape(x,groundY,angle,scale,alpha=1){
 ctx.save();
 ctx.translate(x,groundY);
 ctx.rotate(angle);
 // The source sprite points left: mirror it only when the player is to the right.
 if(shoeFacesRight())ctx.scale(-1,1);
 ctx.globalAlpha=alpha;
 if(selectedLevel===4 && poolWedgeSprite.complete && poolWedgeSprite.naturalWidth){
   // Piscina: otto pose della zeppa rosa, con gamba lunga e sfondo già trasparente.
   let frame=0;
   if(shoe.phase==='drop'){
     frame=3-Math.min(3,Math.floor(clamp(shoe.t/.52,0,1)*4));
   } else if(shoe.phase==='press'){
     frame=0;
   } else if(shoe.phase==='lift' && shoe.recovering){
     frame=1+Math.min(4,Math.floor(clamp(shoe.t/.48,0,1)*5));
   } else if(shoe.phase==='lift'){
     frame=Math.min(3,Math.floor(clamp(shoe.t/.48,0,1)*4));
   } else if(shoe.phase==='move'){
     frame=3;
   }
   frame=clamp(frame,0,POOL_FRAMES-1);
   const sx=(frame%4)*POOL_FRAME_W;
   const sy=Math.floor(frame/4)*POOL_FRAME_H;
   const spriteScale=scale*1.23*2.0;
   const w=POOL_FRAME_W*spriteScale, h=POOL_FRAME_H*spriteScale;
   const groundAlign=7*spriteScale;
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';
   ctx.drawImage(poolWedgeSprite,sx,sy,POOL_FRAME_W,POOL_FRAME_H,
     -w/2,-h+groundAlign,w,h);
 } else if(selectedLevel===3 && classroomShoeSprite.complete && classroomShoeSprite.naturalWidth){
   // Aula 5F: 0-3 discesa punta-alta, 3 appoggio, 4-7 rialzo dal tallone.
   let frame=7;
   if(shoe.phase==='drop'){
     frame=Math.min(3,Math.floor(clamp(shoe.t/.52,0,1)*4));
   } else if(shoe.phase==='press'){
     frame=3;
   } else if(shoe.phase==='lift' && shoe.recovering){
     frame=4+Math.min(3,Math.floor(clamp(shoe.t/.48,0,1)*4));
   }
   const sx=(frame%4)*CLASSROOM_FRAME_W;
   const sy=Math.floor(frame/4)*CLASSROOM_FRAME_H;
   const spriteScale=scale*1.23*1.65;
   const w=CLASSROOM_FRAME_W*spriteScale, h=CLASSROOM_FRAME_H*spriteScale;
   // All frames share the same ground anchor; frames 1-2 remain visibly airborne.
   // Raise the Aula 5F shoe artwork a further 20px to correct the visual contact height.
   const groundAlign=(CLASSROOM_FRAME_H-412)*spriteScale;
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';
   ctx.drawImage(classroomShoeSprite,sx,sy,CLASSROOM_FRAME_W,CLASSROOM_FRAME_H,
     -w/2,-h-27+groundAlign,w,h);
 } else if(selectedLevel===2 && officeShoeSprite.complete && officeShoeSprite.naturalWidth){
   // Eight frames: 0-3 descent, 4-5 planted hold, 6-7 recovery lift.
   let frame=0;
   if(shoe.phase==='drop'){
     frame=Math.min(3,Math.floor(clamp(shoe.t/.52,0,1)*4));
   } else if(shoe.phase==='press'){
     frame=shoe.t<.10?4:5;
   } else if(shoe.phase==='lift' && shoe.recovering){
     frame=6+Math.min(1,Math.floor(clamp(shoe.t/.48,0,1)*2));
   }
   const sx=(frame%4)*OFFICE_FRAME_W;
   const sy=Math.floor(frame/4)*OFFICE_FRAME_H;
   const spriteScale=scale*1.23*1.03;
   const w=OFFICE_FRAME_W*spriteScale, h=OFFICE_FRAME_H*spriteScale;
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';
   ctx.drawImage(officeShoeSprite,sx,sy,OFFICE_FRAME_W,OFFICE_FRAME_H,
     -w/2,-h+7,w,h);
 } else if(giantessSprite.complete && giantessSprite.naturalWidth){
   let frame=0;
   if(shoe.phase==='drop'){
     frame=shoe.t<.25?5:6;
   } else if(shoe.phase==='press'){
     frame=shoe.t<.12?6:7;
   }
   const spriteScale=scale*1.23*1.65;
   const w=GIANTESS_FRAME_W*spriteScale, h=GIANTESS_FRAME_H*spriteScale;
   frame=clamp(frame,0,GIANTESS_FRAMES-1);
   ctx.drawImage(giantessSprite,frame*GIANTESS_FRAME_W,0,
     GIANTESS_FRAME_W,GIANTESS_FRAME_H,-w/2,-h+7,w,h);
 } else {
   ctx.fillStyle='#eaa0bb';ctx.beginPath();ctx.ellipse(0,-95,150,65,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function plantedSoleOffsetY(){
 // Contact point measured at the horizontal center of the actual planted frame,
 // not at the lowest opaque pixel anywhere across the sprite.
 if(selectedLevel===4){
   const s=.78*1.23*2.0;
   const h=POOL_FRAME_H*s;
   const groundAlign=7*s;
   const contactRow=355;
   return -h+groundAlign+contactRow*s;
 }
 if(selectedLevel===3){
   const s=.78*1.23*1.65;
   const h=CLASSROOM_FRAME_H*s;
   const groundAlign=(CLASSROOM_FRAME_H-412)*s;
   return -h-27+groundAlign+426*s;
 }
 if(selectedLevel===2){
   const s=.78*1.23*1.03;
   const h=OFFICE_FRAME_H*s;
   const frame=shoe.t<.10?4:5;
   const contactRow=frame===4?704:696;
   return -h+7+contactRow*s;
 }
 const s=.78*1.23*1.65;
 const h=GIANTESS_FRAME_H*s;
 const contactRow=shoe.t<.12?381:383;
 return -h+7+contactRow*s;
}
function drawWarning(){
 if(shoe.aiTell>0){
  const pulse=.5+.5*Math.sin(performance.now()/55);
  ctx.save();ctx.globalAlpha=.25+.45*pulse;ctx.strokeStyle=shoe.aiMode==='predator'?'#ff5a69':'#ffd27a';ctx.lineWidth=5;
  ctx.beginPath();ctx.ellipse(shoe.x,565,154+pulse*9,25+pulse*3,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
}
function spawnStain(){
 const impactX=shoe.impactX??player.x;
 stain={x:impactX,y:495,r:7,alpha:1,shoeResidue:true}; // Blood effects share the planted-sole ground reference Y=555.
 for(let i=0;i<34;i++){let a=Math.random()*Math.PI*2,s=30+Math.random()*150;particles.push({x:impactX,y:player.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6+Math.random()*.8,max:1.4,r:1+Math.random()*4});}
}
function survivalTargetSeconds(){return difficulties[difficulty].survivalSeconds;}
function beginVictory(){
 if(victoryPhase!=='none'||dead)return;
 elapsed=survivalTargetSeconds();
 running=false;victoryPhase='run';victoryTimer=0;
 Object.keys(keys).forEach(key=>keys[key]=false);sprintHeld=false;
 player.state='idle';player.stateT=0;player.facing=1;player.sprinting=true;player.moveVX=520;player.moveVY=0;
 shoe.aiMode='stopped';
}
function finishVictory(){
 if(victoryPhase!=='run')return;
 victoryPhase='complete';
 if(unsavedPlayTime>0){SaveManager.addPlayTime(unsavedPlayTime);unsavedPlayTime=0;}
 SaveManager.recordVictory(selectedLevel,elapsed);
 const nextLevel=selectedLevel+1;
 const hasNext=nextLevel<=SaveManager.getUnlockedLevel() && nextLevel<=4;
 overlay.classList.remove('game-over-menu');
 overlay.classList.add('victory-menu');
 overlay.classList.remove('hidden');
 overlay.querySelector('h2').textContent=selectedLevel===4?'CAMPAGNA COMPLETATA':'LIVELLO COMPLETATO';
 overlay.querySelector('p').textContent=selectedLevel===4
   ? 'Hai superato tutti i livelli disponibili. Sei riuscito a sopravvivere!'
   : `Sei sopravvissuto per ${survivalTargetSeconds()} secondi. Il livello ${nextLevel} è stato sbloccato!`;
 document.getElementById('start').textContent='RIPROVA';
 document.getElementById('victoryNext').style.display=hasNext?'block':'none';
 document.getElementById('victoryMenu').textContent='MENÙ PRINCIPALE';
}
function update(dt){
 if(victoryPhase==='run'){
   victoryTimer+=dt;unsavedPlayTime+=dt;
   if(unsavedPlayTime>=10){SaveManager.addPlayTime(unsavedPlayTime);unsavedPlayTime=0;}
   player.x+=520*dt;player.facing=1;player.sprinting=true;player.moveVX=520;player.anim=(player.anim||0)+dt*1.45;
   cameraX+=(clamp(player.x-W/2,0,WORLD_W-W)-cameraX)*Math.min(1,dt*5);
   if(player.x>WORLD_W+90)finishVictory();
   return;
 }
 if(!running||dead||victoryPhase!=='none')return;
 elapsed=(performance.now()-startTime)/1000;
 if(elapsed>=survivalTargetSeconds()){beginVictory();return;}
 unsavedPlayTime+=dt;
 if(unsavedPlayTime>=10){SaveManager.addPlayTime(unsavedPlayTime);unsavedPlayTime=0;}
 player.inv=Math.max(0,player.inv-dt);
 const vx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
 const sprintRequested=(!!keys.shift || sprintHeld) && vx!==0;
 // Esaurimento: una volta raggiunto lo 0%, lo sprint resta bloccato
 // finché la stamina non recupera almeno il 30%.
 const sprinting=sprintRequested && !sprintLocked && stamina>0.5;
 const sprintBtn=document.querySelector('.sprintbtn');if(sprintBtn)sprintBtn.classList.toggle('active-sprint',sprinting);
 if(sprinting){
   stamina=Math.max(0,stamina-36*dt);
   if(stamina<=0){stamina=0;sprintLocked=true;}
 }else{
   stamina=Math.min(MAX_STAMINA,stamina+23*dt);
   if(sprintLocked && stamina>=MAX_STAMINA*0.30)sprintLocked=false;
 }
 const moveSpeed=sprinting?405:player.speed;
 if(vx){player.x+=vx*moveSpeed*dt;player.facing=vx;}
 player.sprinting=sprinting;player.moveVX=vx*moveSpeed;player.moveVY=0;
 player.anim=(player.anim||0)+dt*(vx?(sprinting?1.45:1.0):.15);
 updateStaminaUI();
 cameraX+=(clamp(player.x-W/2,0,WORLD_W-W)-cameraX)*Math.min(1,dt*5);
 if(player.state==='fall'){player.stateT+=dt;if(player.stateT>.62){player.state='idle';player.stateT=0;}}
 if(player.state==='squashed'){player.stateT+=dt;}
 player.x=clamp(player.x,28,WORLD_W-28);
 // Adaptive hunt: variable pace, readable bursts and recovery windows.
 const baseSpeed=difficulty==='hard'?340:292;
 const dxToPlayer=player.x-shoe.x, gap=Math.abs(dxToPlayer);
 shoe.aiCooldown=Math.max(0,shoe.aiCooldown-dt);
 shoe.aiTell=Math.max(0,shoe.aiTell-dt);
 shoe.aiModeT=Math.max(0,shoe.aiModeT-dt);
 shoe.t+=dt;
 if(shoe.phase==='lift'){
   if(shoe.t>.48){
     shoe.phase='move';shoe.t=0;shoe.aimTimer=0;shoe.step++;
     shoe.recovering=false;
     shoe.aiMode='hunt';
     // If the player has opened a large gap, the hunt can trigger a catch-up burst.
     const farChance=difficulty==='hard'?.78:.62;
     const nearChance=difficulty==='hard'?.34:.23;
     if(shoe.aiCooldown<=0 && Math.random()<(gap>520?farChance:(gap<230?nearChance:.38))){
       if(gap>520){
         shoe.aiMode='predator';shoe.aiModeT=difficulty==='hard'?1.55:1.25;
         shoe.aiTell=.32; // brief visual/audio warning before the burst
       }else if(Math.random()<.52){
         shoe.aiMode='feint';shoe.aiModeT=.48+Math.random()*.32;
       }else{
         shoe.aiMode='surge';shoe.aiModeT=.72+Math.random()*.38;
         shoe.aiTell=.2;
       }
       shoe.aiCooldown=difficulty==='hard'?3.6:4.6;
     }else{
       shoe.aiMode='hunt';shoe.aiModeT=.6+Math.random()*1.1;
     }
     const lead=difficulty==='hard'?.58:.4;
     shoe.tx=clamp(player.x+(player.moveVX||0)*lead,100,WORLD_W-100);
   }
 } else if(shoe.phase==='move'){
   shoe.aimTimer-=dt;
   if(shoe.aimTimer<=0){
     const lead=difficulty==='hard'?.62:.42;
     // Feints briefly predict less accurately; other modes actively lead the runner.
     const feintFactor=shoe.aiMode==='feint'?.12:1;
     shoe.tx=clamp(player.x+(player.moveVX||0)*lead*feintFactor,100,WORLD_W-100);
     shoe.aimTimer=difficulty==='hard'?.13:.2;
   }
   let pace=0.78+0.25*(.5+.5*Math.sin(shoe.t*5.1+shoe.step*1.7));
   if(shoe.aiMode==='surge')pace=1.48;
   if(shoe.aiMode==='predator')pace=difficulty==='hard'?2.05:1.82;
   if(shoe.aiMode==='feint')pace=.48;
   // Distance-based catch-up keeps sprinting away viable, but never completely safe.
   if(gap>650)pace=Math.max(pace,difficulty==='hard'?1.72:1.48);
   shoe.speed=baseSpeed*pace;
   const dx=shoe.tx-shoe.x,dist=Math.abs(dx),step=shoe.speed*dt;
   if(dist>1)shoe.x+=Math.sign(dx)*Math.min(step,dist);
   shoe.x=clamp(shoe.x,100,WORLD_W-100);
   if(dist<34||shoe.t>1.8){
     // Snapshot the facing at the exact start of the attack. Player direction
     // changes during the fall must not flip the shoe mid-stomp.
     shoe.attackFacesRight=selectedLevel===4 ? player.x<shoe.x : player.x>shoe.x;
     shoe.recovering=false;
     shoe.phase='drop';shoe.t=0;shoe.aiMode='hunt';
   }
 } else if(shoe.phase==='drop'){
   if(shoe.t>=.52){
     // Level 2 collision follows the two places where the office-shoe sprite
     // actually reaches the floor: forefoot/sole and the narrow heel tip.
     // Coordinates are measured from the planted frames (3-5) of officeShoeSprite.
     // The sprite points left by default; mirror the local axis for right-facing attacks.
     let overlap=false;
     if(selectedLevel===2){
       const spriteScale=.78*1.23*1.03;
       const localX=(player.x-shoe.x)*(shoe.attackFacesRight?-1:1)/spriteScale;
       const soleContact=localX>=-266 && localX<=38; // forefoot / sole
       const heelContact=localX>=152 && localX<=201; // narrow heel tip
       overlap=soleContact||heelContact;
       // The heel is a lethal contact point; the forefoot keeps normal damage.
       if(heelContact)die(player.x);
       else if(soleContact)takeDamage();
     } else if(selectedLevel===4){
       // Piscina: zona di contatto ampia lungo il plateau e la punta della zeppa.
       overlap=Math.abs(player.x-shoe.x)<245;
       if(overlap)takeDamage();
     } else if(selectedLevel===3){
       // Aula 5F: contact zone spans the long Mary Jane sole and rounded toe.
       overlap=Math.abs(player.x-shoe.x)<275;
       if(overlap)takeDamage();
     } else {
       // Preserve Level 1's original collision behavior exactly.
       overlap=Math.abs(player.x-shoe.x)<205;
       if(overlap)takeDamage();
     }
     shoe.phase='press';
     shoe.t=0;
     shoe.landedHit=overlap;
   }
 } else if(shoe.phase==='press'){
   // Keep the sole visibly planted for a readable impact/recovery window.
   if(shoe.t>.68){shoe.phase='lift';shoe.t=0;shoe.landedHit=false;shoe.recovering=true;}
 }
 if(shoe.phase==='press' && shoe.t<.08 && !shoe.dustMade){
   shoe.dustMade=true;
   // Match the dust burst to the actual rendered shoe width for each level.
   const dustSoleWidth=selectedLevel===4
     ? POOL_FRAME_W*.78*1.23*2.0*.45*.82
     : selectedLevel===3
       ? CLASSROOM_FRAME_W*.78*1.23*1.65*.82
       : selectedLevel===2
       ? OFFICE_FRAME_W*.78*1.23*1.03*.82
       : GIANTESS_FRAME_W*.78*1.23*1.65*.82;
   const dustHalfWidth=dustSoleWidth*.5;
   // The planted sole's lowest opaque pixel is aligned with the shadow center.
   const dustContactY=555;
   for(let i=0;i<30;i++){
     const offset=(Math.random()*2-1)*dustHalfWidth;
     const edgeBias=Math.sign(offset||1);
     const ang=(Math.random()*Math.PI*2);
     const sp=38+Math.random()*115;
     particles.push({
       x:shoe.x+offset,
       y:dustContactY+(Math.random()-.5)*2,
       vx:Math.cos(ang)*sp+edgeBias*(12+Math.random()*20),
       vy:Math.sin(ang)*sp*.35,
       life:.42+Math.random()*.38,
       max:.8,
       r:1.8+Math.random()*3.7,
       dust:true
     });
   }
 }
 if(shoe.phase!=='press')shoe.dustMade=false;
 particles=particles.filter(p=>p.life>0);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt;}
}
function takeDamage(){
 if(player.inv>0 || dead)return;
 // Save the actual contact coordinate before any knockback can move the character.
 const contactX=player.x;
 hp=Math.max(0,hp-1); updateHealthUI(); flash=.45;
 if(hp<=0){
   player.x=contactX;
   player.hitX=contactX;
   die(contactX);
   return;
 }
 player.inv=1.15; player.state='fall'; player.stateT=0;
 // Non-fatal hits still give the player a brief knockback to escape.
 const dx=player.x-shoe.x; player.x=clamp(player.x+Math.sign(dx||1)*42,28,WORLD_W-28);
}
function die(contactX=player?.x??shoe.x){
 dead=true;running=false;deathTimer=0;defeatPhase='none';defeatTimer=0;
 if(unsavedPlayTime>0){SaveManager.addPlayTime(unsavedPlayTime);unsavedPlayTime=0;}
 SaveManager.recordDeath(selectedLevel,elapsed);
 if(typeof shoe.attackFacesRight!=='boolean')shoe.attackFacesRight=selectedLevel===4 ? player.x<shoe.x : player.x>shoe.x;
 shoe.phase='press';shoe.t=0;shoe.recovering=true;
 // Keep the shoe anchored where it actually landed; store the victim position
 // separately for the blood effect.
 shoe.deathX=shoe.x;
 shoe.impactX=clamp(contactX,28,WORLD_W-28);
 if(player){player.x=shoe.impactX;player.state='squashed';player.stateT=.5;}
 if(selectedLevel===2){stain={x:shoe.impactX,y:495,r:7,alpha:1,shoeResidue:true};}
 else if(selectedLevel===3){stain=null;particles=[];}
 else {spawnStain();}
 flash=1;best=Math.max(best,elapsed);
}

function drawLevel2TwistFinisher(dt){
 deathTimer+=dt;
 const t=deathTimer;
 // Cinematic timing: impact slow-motion hold, short still pause, twist, then lift.
 const impactSlowDuration=.45,pauseDuration=.65,twistDuration=2.4,liftDuration=1.65;
 const twistStart=impactSlowDuration+pauseDuration;
 const liftStart=twistStart+twistDuration;
 const twistT=clamp((t-twistStart)/twistDuration,0,1);
 const liftT=clamp((t-liftStart)/liftDuration,0,1);
 const isLifting=t>=liftStart;
 const footLift=100*(liftT*liftT*(3-2*liftT));

 // Blood appears only when the twisting motion begins.
 const poolProgress=clamp((t-twistStart)/twistDuration,0,1);
 const poolFrame=Math.min(5,Math.floor(poolProgress*6));
 if(t>=twistStart&&puddleFX.complete&&puddleFX.naturalWidth){
   ctx.save();ctx.globalAlpha=clamp(poolProgress/.28,0,1);
   ctx.drawImage(puddleFX,poolFrame*FX_POOL_W,0,FX_POOL_W,100,stain.x-155,stain.y-40,360,100);
   ctx.restore();
 }
 drawPlayer();

 // Frame 0 holds the planted shoe during impact and the still pause.
 // The eight-frame twist starts only after those two beats.
 const frame=t<twistStart?0:Math.min(7,Math.floor(twistT*8));
 const shoeCenter=shoe.deathX??shoe.x;
 const spriteScale=.78*1.23*1.03,w=OFFICE_TWIST_FRAME_W*spriteScale,h=OFFICE_TWIST_FRAME_H*spriteScale;
 const soleY=555-footLift;

 // Keep the strand at a constant scale and aspect ratio, anchored to the sole.
 if(isLifting&&stickyBloodFX.complete&&stickyBloodFX.naturalWidth){
   const strandFrame=Math.min(7,Math.floor(clamp(liftT,.0,.999)*8));
   const topX=[76,74,92,108,114,117,108,104][strandFrame];
   const bottomY=stain.y+18;
   const strandScaleX=.95;
   const strandScaleY=.42;
   const drawW=STICKY_BLOOD_FRAME_W*strandScaleX;
   const drawH=STICKY_BLOOD_FRAME_H*strandScaleY;
   const visibleBottomY=616;
   const shoeMinX=shoeCenter-w*.36,shoeMaxX=shoeCenter+w*.36;
   const anchorX=clamp(stain.x,shoeMinX,shoeMaxX);
   const drawX=anchorX-topX*strandScaleX;
   const drawY=bottomY-visibleBottomY*strandScaleY;
   ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(stickyBloodFX,strandFrame*STICKY_BLOOD_FRAME_W,0,
     STICKY_BLOOD_FRAME_W,STICKY_BLOOD_FRAME_H,drawX,drawY,drawW,drawH);
   ctx.restore();
 }

 ctx.save();
 ctx.translate(shoeCenter,548-footLift);
 if(shoe.attackFacesRight)ctx.scale(-1,1);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(officeTwistSprite.complete&&officeTwistSprite.naturalWidth){
   ctx.drawImage(officeTwistSprite,(frame%4)*OFFICE_TWIST_FRAME_W,
     Math.floor(frame/4)*OFFICE_TWIST_FRAME_H,OFFICE_TWIST_FRAME_W,OFFICE_TWIST_FRAME_H,
     -w/2,-h+7,w,h);
 }
 ctx.restore();

 // A brief white impact flash punctuates the fatal stomp, then clears before the twist.
 const flashAlpha=t<.08?.78:.78*(1-clamp((t-.08)/.34,0,1));
 if(flashAlpha>0){
   ctx.save();ctx.setTransform(1,0,0,1,0,0);
   ctx.globalAlpha=flashAlpha;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.restore();
 }
}


function drawClassroomFinisherShoe(sprite,frame,x,groundY){
 if(!sprite.complete||!sprite.naturalWidth)return;
 const spriteScale=.78*1.23*1.65; // Match the live Aula 5F gameplay shoe scale.
 const w=CLASSROOM_FINISHER_FRAME_W*spriteScale;
 const h=CLASSROOM_FINISHER_FRAME_H*spriteScale;
 const groundAlign=(CLASSROOM_FINISHER_FRAME_H-412)*spriteScale;
 ctx.save();
 ctx.translate(x,groundY);
 if(shoe.attackFacesRight)ctx.scale(-1,1);
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(sprite,(frame%4)*CLASSROOM_FINISHER_FRAME_W,
   Math.floor(frame/4)*CLASSROOM_FINISHER_FRAME_H,
   CLASSROOM_FINISHER_FRAME_W,CLASSROOM_FINISHER_FRAME_H,
   -w/2,-h-27+groundAlign,w,h);
 ctx.restore();
}

function drawClassroomBloodDragTrail(startX,direction,progress,groundY){
 const p=clamp(progress,0,1);
 if(p<=0.002||!classroomBloodDragSprite.complete||!classroomBloodDragSprite.naturalWidth)return;
 const frame=Math.min(7,Math.max(0,Math.ceil(p*8)-1));
 const w=357,h=118;
 const toeOffset=-direction*92; // Further shift the whole smear toward the shoe toe, opposite the backward scrub direction.
 const x=(direction>0?startX-8:startX+8-w)+toeOffset;
 const y=groundY-h+30;
 ctx.save();
 if(direction<0){
   ctx.translate(x+w,y);
   ctx.scale(-1,1);
   ctx.drawImage(classroomBloodDragSprite,
     (frame%4)*CLASSROOM_BLOOD_FRAME_W,Math.floor(frame/4)*CLASSROOM_BLOOD_FRAME_H,
     CLASSROOM_BLOOD_FRAME_W,CLASSROOM_BLOOD_FRAME_H,
     0,0,w,h);
 }else{
   ctx.drawImage(classroomBloodDragSprite,
     (frame%4)*CLASSROOM_BLOOD_FRAME_W,Math.floor(frame/4)*CLASSROOM_BLOOD_FRAME_H,
     CLASSROOM_BLOOD_FRAME_W,CLASSROOM_BLOOD_FRAME_H,
     x,y,w,h);
 }
 ctx.restore();
}

function drawLevel3ClassroomFinisher(dt){
 if(defeatPhase==='none')deathTimer+=dt;
 const t=deathTimer;
 // 1) impact/flat, 2) toe lift, 3) maximum sole view; then reverse 2 -> 1.
 const impactHold=.34, riseDuration=.72, inspectionPause=1.05, returnDuration=.62;
 const replantPause=.18, heelLiftDuration=.30, scrubDuration=3.0, finalLiftDuration=.78;
 const riseStart=impactHold;
 const inspectStart=riseStart+riseDuration;
 const returnStart=inspectStart+inspectionPause;
 const heelStart=returnStart+returnDuration+replantPause;
 const scrubStart=heelStart+heelLiftDuration;
 const finalLiftStart=scrubStart+scrubDuration;
 const baseX=shoe.deathX??shoe.x;
 const backDir=shoe.attackFacesRight?-1:1;
 let x=baseX, groundY=582, effectGroundY=555, frame=0, showAttached=true;
 if(t<impactHold){
   drawClassroomFinisherShoe(classroomFinisherSprite,0,x,groundY);
 }else if(t<inspectStart){
   const p=clamp((t-riseStart)/riseDuration,0,1);
   frame=p<.48?1:2;
   drawClassroomFinisherShoe(classroomFinisherSprite,frame,x,groundY);
 }else if(t<returnStart){
   drawClassroomFinisherShoe(classroomFinisherSprite,2,x,groundY);
 }else if(t<returnStart+returnDuration){
   const p=clamp((t-returnStart)/returnDuration,0,1);
   frame=p<.55?1:0;
   drawClassroomFinisherShoe(classroomFinisherSprite,frame,x,groundY);
 }else if(t<heelStart){
   drawClassroomFinisherShoe(classroomFinisherSprite,0,x,groundY);
 }else if(t<scrubStart){
   const p=clamp((t-heelStart)/heelLiftDuration,0,1);
   drawClassroomFinisherShoe(classroomFinisherSprite,p<.55?6:7,x,groundY);
 }else if(t<finalLiftStart){
   // One fixed toe-planted pose is translated slowly; no walking cycle.
   showAttached=false;
   const p=clamp((t-scrubStart)/scrubDuration,0,1);
   x=baseX+backDir*(112*p);
   drawClassroomBloodDragTrail(baseX,backDir,p,effectGroundY);
   drawClassroomFinisherShoe(classroomFinisherSprite,7,x,groundY);
 }else{
   showAttached=false;
   const p=clamp((t-finalLiftStart)/finalLiftDuration,0,1);
   const eased=p*p*(3-2*p);
   x=baseX+backDir*112;
   drawClassroomBloodDragTrail(baseX,backDir,1,effectGroundY);
   // Three gradual lift steps, leaving the floor clear for the later blood trail.
   const liftFrame=p<.34?6:(p<.68?7:7);
   const lift=p<.34?5*eased:(p<.68?14*eased:25*eased);
   drawClassroomFinisherShoe(classroomFinisherSprite,liftFrame,x,groundY-lift);
 }
 // Brief impact flash only; blood and particles will be added in a later pass.
 const flashAlpha=t<.08?.55:.55*(1-clamp((t-.08)/.28,0,1));
 if(flashAlpha>0){
   ctx.save();ctx.setTransform(1,0,0,1,0,0);
   ctx.globalAlpha=flashAlpha;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.restore();
 }
}

function drawLevel4PoolFinisher(dt){
 if(defeatPhase==='none')deathTimer+=dt;
 const t=deathTimer;
 const baseX=shoe.deathX??shoe.x;
 // The generated 8-frame strip already contains the complete water + theatrical-red
 // splash. Progressively longer trails are therefore revealed without extra FX layers.
 const handoffHold=.12, impactEnd=.78, slideStart=.78, slideEnd=1.92;
 let frame=1, slide=0;
 // Seamless handoff: the first cinematic beat reuses the exact planted gameplay
 // sprite (same frame, transform, scale and sole anchor). The composite finisher
 // then begins on its first settling/splash pose, avoiding the old raised-frame pop.
 if(t<handoffHold){frame=-1;}
 else if(t<.34){frame=1;}
 else if(t<.55){frame=2;}
 else if(t<impactEnd){frame=3;}
 else if(t<slideEnd){
   const p=clamp((t-slideStart)/(slideEnd-slideStart),0,1);
   frame=4+Math.min(2,Math.floor(p*3));
   const eased=p*p*(3-2*p);
   slide=72*eased;
 }else{
   // Frame 7 already depicts the sandal lifted clear of the puddle.
   // Keep the composite sprite at the same floor anchor so its puddle/trail
   // remains fixed on the ground; do not apply the generic extra lift here.
   frame=7;
   slide=72;
 }
 frame=clamp(frame,0,POOL_FINISHER_FRAMES-1);
 const direction=shoe.attackFacesRight?-1:1;
 const x=baseX+direction*slide;
 const scale=.78*1.23*2.0;
 const w=POOL_FINISHER_FRAME_W*scale, h=POOL_FINISHER_FRAME_H*scale;
 // In the composite sheet the wet trail reaches the bottom around source row 322.
 // Align that row to the established pool floor contact line.
 const groundY=555;
 const groundAlign=(POOL_FINISHER_FRAME_H-322)*scale;
 if(frame===-1){
   // Draw the exact final gameplay pose while the cinematic takes over.
   // shoeShape() uses pool-wedge frame 0 with the same live-game transform.
   shoeShape(baseX,555-plantedSoleOffsetY(),-.015,.78,1);
 }else if(poolFinisherSprite.complete&&poolFinisherSprite.naturalWidth){
   ctx.save();
   ctx.translate(x,groundY);
   if(shoe.attackFacesRight)ctx.scale(-1,1);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   const sx=(frame%4)*POOL_FINISHER_FRAME_W;
   const sy=Math.floor(frame/4)*POOL_FINISHER_FRAME_H;
   ctx.drawImage(poolFinisherSprite,sx,sy,POOL_FINISHER_FRAME_W,POOL_FINISHER_FRAME_H,
     -w/2,-h+groundAlign,w,h);
   ctx.restore();
 }else{
   // Fallback to the regular pool shoe if the dedicated finisher asset fails to load.
   shoe.phase='press';shoe.t=.12;
   shoeShape(x,groundY,0,.78,1);
 }
 // Small impact flash, restrained so the integrated water and red streak remain visible.
 const flashAlpha=t<.10?.48:.48*(1-clamp((t-.10)/.28,0,1));
 if(flashAlpha>0){
   ctx.save();ctx.setTransform(1,0,0,1,0,0);
   ctx.globalAlpha=flashAlpha;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.restore();
 }
}

function drawDeath(dt){
 if(selectedLevel===4){drawLevel4PoolFinisher(dt);return;}
 if(selectedLevel===3){drawLevel3ClassroomFinisher(dt);return;}
 if(selectedLevel===2){drawLevel2TwistFinisher(dt);return;}

 deathTimer+=dt*0.48;const t=deathTimer;
 const impactFrame=Math.min(7,Math.floor(t/.075));
 const poolFrame=Math.min(5,Math.max(0,Math.floor((t-.22)/.16)));
 let lift=0;if(t>1.0){const k=clamp((t-1.0)/1.25,0,1);lift=94*(k*k*(3-2*k));}
 const footY=548-lift+(t<.22?Math.sin(t/.22*Math.PI)*12:0);
 drawPlayer();
 if(t<.62&&impactFX.complete&&impactFX.naturalWidth){const alpha=t<.45?1:clamp((.62-t)/.17,0,1);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(impactFX,impactFrame*FX_IMPACT_W,0,FX_IMPACT_W,176,stain.x-88,stain.y-112,360,176);ctx.restore();}
 if(t>.2&&puddleFX.complete&&puddleFX.naturalWidth){const alpha=clamp((t-.2)/.3,0,1);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(puddleFX,poolFrame*FX_POOL_W,0,FX_POOL_W,100,stain.x-95,stain.y-40,360,100);ctx.restore();}
 // Sticky blood: an independent pixel-art strip, anchored to the underside of the rising shoe.
 // It is drawn before the shoe so its upper tip disappears beneath the sole.
 if(t>1.0&&stickyBloodFX.complete&&stickyBloodFX.naturalWidth){
   const progress=clamp((t-1.0)/1.28,0,.999);
   const frame=Math.min(STICKY_BLOOD_FRAMES-1,1+Math.floor(progress*(STICKY_BLOOD_FRAMES-1)));
   // Keep the strand vertically aligned with the actual impact/puddle point,
   // not with the center of the shoe. Widen it slightly without changing its length.
   const scaleX=1.75, scaleY=.36; // substantially wider strand (+75%), same height

   const drawW=STICKY_BLOOD_FRAME_W*scaleX, drawH=STICKY_BLOOD_FRAME_H*scaleY;
   const bottomY=stain.y+28, anchorX=stain.x;
   ctx.save();
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(stickyBloodFX,frame*STICKY_BLOOD_FRAME_W,0,
     STICKY_BLOOD_FRAME_W,STICKY_BLOOD_FRAME_H,
     anchorX-drawW/2,bottomY-drawH,drawW,drawH);
   ctx.restore();
 }
 shoe.phase='press';shoe.t=.12;shoeShape(shoe.x,footY,t<.22?-.025*Math.sin(t*35):-.012,.78,1);
 if(t<.28){const a=(1-t/.28)*.24;ctx.fillStyle=`rgba(255,238,225,${a})`;ctx.fillRect(0,0,W,H);}
 // Full-screen white flash on the fatal impact, fading out during slow motion.
 const impactFlash=t<.10?.82:.82*(1-clamp((t-.10)/.42,0,1));
 if(impactFlash>0){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=impactFlash;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
}



function drawDefeatScene(dt){
 document.getElementById('wrap').classList.add('defeat-sequence-clean');
 defeatTimer+=dt;
 const t=defeatTimer;
 const level=getLevel();
 const isOffice=level.id===2;
 const isClassroom=level.id===3;
 const image=level.id===4?poolDefeatImage:(level.id===3?classroomDefeatImage:(level.id===2?officeDefeatImage:gymDefeatImage));
 const phrase=level.defeatPhrase;
 // Start close on the sneaker sole, then smoothly reveal the complete illustration.
 const zoomOut=clamp((t-.35)/3.0,0,1);
 const eased=zoomOut*zoomOut*(3-2*zoomOut);
 const zoom=2.45+(1-2.45)*eased;
 const fade=clamp(t/.65,0,1);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 ctx.fillStyle='#080a10';ctx.fillRect(0,0,W,H);
 if(image.complete&&image.naturalWidth){
   const iw=image.naturalWidth,ih=image.naturalHeight;
   const targetAspect=W/H,sourceAspect=iw/ih;
   let baseW=iw,baseH=ih;
   if(sourceAspect>targetAspect)baseW=ih*targetAspect;else baseH=iw/targetAspect;
   const cropW=baseW/zoom,cropH=baseH/zoom;
   // Open on the lifted Mary Jane sole for the classroom, then reveal the complete hallway.
   const focusX=iw*(level.defeatFocus?.x ?? (isClassroom?.50:(isOffice?.39:.36)));
   const focusY=ih*(level.defeatFocus?.y ?? (isClassroom?.65:(isOffice?.40:.27))); 
   const sx=clamp(focusX-cropW/2,0,iw-cropW);
   const sy=clamp(focusY-cropH/2,0,ih-cropH);
   ctx.globalAlpha=fade;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(image,sx,sy,cropW,cropH,0,0,W,H);
 }
 const textAlpha=clamp((t-3.55)/.85,0,1);
 if(textAlpha>0){
   ctx.globalAlpha=textAlpha;
   const grad=ctx.createLinearGradient(0,H-118,0,H);
   grad.addColorStop(0,'rgba(5,7,12,0)');grad.addColorStop(1,'rgba(5,7,12,.86)');
   ctx.fillStyle=grad;ctx.fillRect(0,H-118,W,118);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff4e5';
   ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=9;
   ctx.font=level.defeatFont;
   if(isClassroom){
     ctx.fillText('Che schifo, mi si è attaccato',W/2,H-82);
     ctx.fillText('qualcosa sulla suola!',W/2,H-52);
   }else{
     ctx.fillText(phrase,W/2,H-70);
   }
   if(t>4.45){
     ctx.shadowBlur=0;ctx.fillStyle='rgba(255,244,229,.82)';ctx.font='12px Arial, sans-serif';
     ctx.fillText('PREMI UN TASTO PER CONTINUARE',W/2,H-31);defeatPhase='wait';
   }
 }
 ctx.restore();
}
function showGameOver(){
 if(defeatPhase!=='wait')return;
 document.getElementById('wrap').classList.remove('defeat-sequence-clean');
 defeatPhase='menu';
 overlay.classList.remove('hidden');
 overlay.classList.remove('victory-menu');
 overlay.classList.add('game-over-menu');
 overlay.querySelector('h2').textContent='GAME OVER';
 overlay.querySelector('p').textContent='Hai esaurito i punti vita. Hai resistito '+elapsed.toFixed(1)+' secondi in modalità '+difficulties[difficulty].label+'.';
 document.getElementById('start').textContent='RIPROVA';
 const returnButton=document.getElementById('returnToMenu');
 if(returnButton)returnButton.textContent='MENÙ PRINCIPALE';
}
function draw(){
 ctx.clearRect(0,0,W,H);drawFloor(cameraX);ctx.save();ctx.translate(-cameraX,0);
 const now=performance.now()/1000;
 for(let i=0;i<24;i++){let px=(i*137+Math.sin(now*.35+i)*18)%W,py=(i*83-now*(8+i%4)*3)%390;if(py<30)py+=360;ctx.globalAlpha=.1+.13*Math.sin(now*2+i);ctx.fillStyle='#ffe0a6';ctx.fillRect(px,py,1.5,1.5);}
 ctx.globalAlpha=1;
 if(dead){
   const frameDt=Math.min(.04,(performance.now()-(draw._last||performance.now()))/1000);
   if(selectedLevel===3 && defeatPhase==='menu')drawLevel3ClassroomFinisher(0);
   else if(selectedLevel===4 && defeatPhase==='menu')drawLevel4PoolFinisher(0);
   else if(selectedLevel===3 && defeatPhase==='wait')drawDefeatScene(0);
   else if(defeatPhase!=='none')drawDefeatScene(frameDt);
   else drawDeath(frameDt);
   draw._last=performance.now();
 } else {
   const approach=shoe.phase==='lift'?0:shoe.phase==='move'?clamp(shoe.t/1.8,0,1):1;
   if(shoe.phase==='lift'||shoe.phase==='move'||shoe.phase==='drop'||shoe.phase==='press'){
     // The shadow is projected onto the floor only; it never follows the airborne sprite.
     drawFootShadow(shoe.x,555,0,shoe.phase==='press'?1:approach);
   }
   let groundY=500,angle=0,scale=1.28;
   if(shoe.phase==='lift'){const bob=Math.min(92,(shoe.t/.48)*92);groundY=500-bob;angle=-.055+Math.sin(shoe.t*7)*.015;scale=1.25;}
   if(shoe.phase==='move'){const bob=88+Math.sin(shoe.t*8)*3;groundY=500-bob;angle=Math.sin(shoe.t*4)*.035;scale=1.27;}
   if(shoe.phase==='drop'){
     angle=.045;scale=1.3;
     const spriteH=(selectedLevel===4
       ? POOL_FRAME_H*(.78*1.23*2.0)
       : selectedLevel===3
         ? CLASSROOM_FRAME_H*(.78*1.23*1.65)
         : selectedLevel===2
        ? OFFICE_FRAME_H*(.78*1.23*1.03)
        : GIANTESS_FRAME_H*(.78*scale*1.23*1.65));
     const fall=clamp(shoe.t/.52,0,1);
     const eased=fall*fall*(3-2*fall);
     // At t=0 the entire sprite is above the camera; it then descends into view.
     groundY=-spriteH+(559+spriteH)*eased;
   }
   if(shoe.phase==='press'){angle=-.015;scale=1.31;groundY=555-plantedSoleOffsetY();}
   // During descent and landing, draw the player first: the sole must visibly
   // pass in front of the character instead of leaving the character on top.
   drawWarning();
   if(shoe.phase==='drop'||shoe.phase==='press'||(shoe.phase==='lift' && shoe.recovering)){
     drawPlayer();
     shoeShape(shoe.x,groundY,angle,.78,1);
   } else {
     drawPlayer();
   }
   for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.dust?'#e7c9a0':'#9b2945';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=1;
 }
 ctx.restore();
 document.getElementById('score').textContent='RESISTI: '+Math.max(0,survivalTargetSeconds()-elapsed).toFixed(1)+' s';
 document.getElementById('healthText').textContent=hp+' / '+maxHp;
}

function loop(t){
 if(backgroundPaused){last=t;requestAnimationFrame(loop);return;}
 let dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);draw();
 if(dead&&defeatPhase==='none'&&deathTimer>getLevel().defeatDelay){defeatPhase='intro';defeatTimer=0;}
 requestAnimationFrame(loop);
}
reset();requestAnimationFrame(loop);
})();
