(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const assets = {};
  const names = ['idle','run','jump','victory'];
  let selected = 'travis', running = false, paused = false, raf = 0, last = 0, camera = 0, score = 0;
  const keys = {left:false,right:false,jump:false};
  const world = {width:5400, ground:600};
  const player = {x:160,y:400,w:92,h:150,vx:0,vy:0,onGround:false,dir:1,anim:0};
  const platforms = [
    {x:0,y:600,w:900,h:120},{x:1040,y:600,w:730,h:120},{x:1910,y:600,w:850,h:120},{x:2930,y:600,w:720,h:120},{x:3800,y:600,w:1600,h:120},
    {x:520,y:475,w:210,h:28},{x:1180,y:440,w:220,h:28},{x:1530,y:360,w:170,h:28},{x:2110,y:455,w:220,h:28},{x:2470,y:375,w:170,h:28},{x:3100,y:450,w:260,h:28},{x:3970,y:430,w:220,h:28},{x:4420,y:345,w:210,h:28}
  ];
  const radios = [620,1240,1600,2180,2530,3200,4050,4510].map((x,i)=>({x,y:[420,385,305,400,320,395,375,290][i],got:false}));
  const cones = [800,1450,2340,3440,4250].map(x=>({x,y:550}));
  const exit = {x:5110,y:390,w:110,h:210};

  function show(id){ screens.forEach(s=>s.classList.toggle('active',s.id===id)); }
  function load(){ ['travis','nick'].forEach(c=>names.forEach(n=>{const im=new Image();im.src=`${c}-${n}.png?v=3`;assets[`${c}-${n}`]=im;})); }
  function reset(){ Object.assign(player,{x:160,y:350,vx:0,vy:0,onGround:false,dir:1,anim:0}); camera=0;score=0;radios.forEach(r=>r.got=false);updateHud(); }
  function updateHud(){document.getElementById('score').textContent=score;document.getElementById('hud-name').textContent=selected.toUpperCase();}
  function start(){reset();show('game-screen');running=true;paused=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
  function rectHit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
  function update(dt){
    const accel=2300,max=selected==='nick'?460:420,jump=selected==='travis'?870:920;
    if(keys.left){player.vx=Math.max(player.vx-accel*dt,-max);player.dir=-1}
    else if(keys.right){player.vx=Math.min(player.vx+accel*dt,max);player.dir=1}
    else player.vx*=Math.pow(.0005,dt);
    if(keys.jump&&player.onGround){player.vy=-jump;player.onGround=false;keys.jump=false}
    player.vy+=2200*dt; const oldY=player.y; player.x+=player.vx*dt; player.y+=player.vy*dt; player.x=Math.max(0,Math.min(world.width-player.w,player.x)); player.onGround=false;
    for(const p of platforms){if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldY+player.h<=p.y+8&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.onGround=true}}
    for(const r of radios){if(!r.got&&rectHit(player,{x:r.x-24,y:r.y-24,w:48,h:48})){r.got=true;score++;updateHud()}}
    for(const c of cones){if(rectHit(player,{x:c.x,y:c.y,w:48,h:50})){player.vx=-player.dir*280;player.vy=-480}}
    if(player.y>H+200){player.x=Math.max(80,player.x-350);player.y=200;player.vx=0;player.vy=0}
    if(rectHit(player,exit)&&score===radios.length){running=false;document.getElementById('result-copy').textContent=`${selected[0].toUpperCase()+selected.slice(1)} recovered every radio and completed the patrol.`;show('result');}
    camera+=(Math.max(0,Math.min(world.width-W,player.x-W*.37))-camera)*Math.min(1,dt*5);player.anim+=dt*Math.abs(player.vx)/110;
  }
  function hill(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x-camera,y,w,h,0,Math.PI,0);ctx.fill()}
  function draw(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#48b9e9');sky.addColorStop(1,'#dff8ff');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff9';for(let i=0;i<9;i++){const x=((i*430-camera*.18)%1800+1800)%1800-180;ctx.beginPath();ctx.arc(x,115+(i%3)*48,45,0,Math.PI*2);ctx.arc(x+45,105+(i%3)*48,60,0,Math.PI*2);ctx.arc(x+96,120+(i%3)*48,40,0,Math.PI*2);ctx.fill()}
    hill(300,610,650,240,'#568b68');hill(1100,620,760,260,'#3d7657');hill(2350,620,900,290,'#477f5b');hill(4100,620,1200,300,'#356b50');
    for(let i=0;i<30;i++){const x=i*210-camera*.65;ctx.fillStyle='#25583f';ctx.beginPath();ctx.moveTo(x,545);ctx.lineTo(x+42,420-(i%4)*18);ctx.lineTo(x+84,545);ctx.fill()}
    ctx.save();ctx.translate(-camera,0);
    for(const p of platforms){ctx.fillStyle='#62472d';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#65a84f';ctx.fillRect(p.x,p.y,p.w,18);ctx.fillStyle='#3f7c3d';for(let x=p.x+15;x<p.x+p.w;x+=50)ctx.fillRect(x,p.y+18,22,7)}
    ctx.fillStyle='#d88916';for(const c of cones){ctx.beginPath();ctx.moveTo(c.x+24,c.y);ctx.lineTo(c.x+48,c.y+48);ctx.lineTo(c.x,c.y+48);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(c.x+10,c.y+25,28,9);ctx.fillStyle='#d88916'}
    ctx.font='40px system-ui';ctx.textAlign='center';for(const r of radios)if(!r.got){ctx.fillText('📻',r.x,r.y+15)}
    ctx.fillStyle=score===radios.length?'#ffd532':'#8da4ad';ctx.fillRect(exit.x,exit.y,exit.w,exit.h);ctx.fillStyle='#122a38';ctx.fillRect(exit.x+12,exit.y+30,exit.w-24,exit.h-30);ctx.fillStyle='white';ctx.font='bold 22px system-ui';ctx.fillText(score===radios.length?'EXIT':'LOCKED',exit.x+exit.w/2,exit.y+24);
    let pose=!player.onGround?'jump':Math.abs(player.vx)>45?'run':'idle';const img=assets[`${selected}-${pose}`];if(img?.complete){ctx.save();ctx.translate(player.x+(player.dir<0?player.w:0),player.y);ctx.scale(player.dir,1);ctx.drawImage(img,0,0,player.w,player.h);ctx.restore()}
    ctx.restore();
    if(score<radios.length){ctx.fillStyle='#051925cc';ctx.fillRect(W/2-180,18,360,40);ctx.fillStyle='white';ctx.font='bold 20px system-ui';ctx.textAlign='center';ctx.fillText('Recover all 8 safety radios',W/2,45)}else{ctx.fillStyle='#0c5b35dd';ctx.fillRect(W/2-190,18,380,40);ctx.fillStyle='white';ctx.font='bold 20px system-ui';ctx.textAlign='center';ctx.fillText('All clear — reach the safety door!',W/2,45)}
  }
  function loop(t){if(!running)return;const dt=Math.min(.032,(t-last)/1000);last=t;if(!paused)update(dt);draw();raf=requestAnimationFrame(loop)}
  document.querySelectorAll('.character-card').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.character;document.querySelectorAll('.character-card').forEach(x=>x.classList.toggle('selected',x===b))}));
  document.getElementById('start').onclick=start;document.getElementById('again').onclick=start;document.getElementById('characters').onclick=()=>show('menu');document.getElementById('pause').onclick=()=>paused=!paused;
  const map={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump'};
  addEventListener('keydown',e=>{if(map[e.key]){keys[map[e.key]]=true;e.preventDefault()}});addEventListener('keyup',e=>{if(map[e.key]){keys[map[e.key]]=false;e.preventDefault()}});
  document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;['pointerdown'].forEach(ev=>b.addEventListener(ev,e=>{keys[k]=true;e.preventDefault()}));['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,e=>{keys[k]=false;e.preventDefault()}))});
  load();
})();
