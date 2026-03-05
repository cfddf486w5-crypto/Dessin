const canvas = document.getElementById('map3d-canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('map3d-tooltip');
const modeButtons = Array.from(document.querySelectorAll('.map3d-modes button'));
const imageInput = document.getElementById('image-input');
const jsonInput = document.getElementById('json-input');
const STORAGE_DB = 'dessin-map3d-db';
const STORAGE_STORE = 'projects';
const STORAGE_KEY = 'current';

const state = { mode: 'wall', camera: { yaw: -0.7, pitch: 0.8, zoom: 58, panX: 0, panY: 0 }, calibration: { pxToM: 0.05, points: [] }, draft: null, pointer: { down: false }, selectedId: null, hoveredId: null, image: null, imageData: null, objects: [], needsSave: false };

function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }
function resize() { const dpr = window.devicePixelRatio || 1; const r = canvas.getBoundingClientRect(); canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); render(); }
window.addEventListener('resize', resize);

function project(p) { const c = state.camera; let x = p.x + c.panX; let z = p.z + c.panY; let y = p.y; const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw); const x1 = x * cy - z * sy, z1 = x * sy + z * cy; const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch); const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + 14; const s = c.zoom / z2; return { x: canvas.clientWidth / 2 + x1 * s, y: canvas.clientHeight / 2 - y1 * s, depth: z2 }; }
function drawPoly(points, fill, stroke) { if (!points.length) return; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } }

function makeBox(obj) { const w = obj.width / 2, d = obj.depth / 2, h = obj.height; const pts = [{x:obj.x-w,y:0,z:obj.z-d},{x:obj.x+w,y:0,z:obj.z-d},{x:obj.x+w,y:0,z:obj.z+d},{x:obj.x-w,y:0,z:obj.z+d},{x:obj.x-w,y:h,z:obj.z-d},{x:obj.x+w,y:h,z:obj.z-d},{x:obj.x+w,y:h,z:obj.z+d},{x:obj.x-w,y:h,z:obj.z+d}].map(project); return { bottom:[pts[0],pts[1],pts[2],pts[3]], top:[pts[4],pts[5],pts[6],pts[7]], left:[pts[0],pts[3],pts[7],pts[4]], right:[pts[1],pts[2],pts[6],pts[5]], front:[pts[3],pts[2],pts[6],pts[7]] }; }

function renderGrid() { for (let i=-30;i<=30;i+=2){ const a=project({x:-30,y:0,z:i}), b=project({x:30,y:0,z:i}); ctx.strokeStyle='rgba(90,110,130,0.2)'; ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke(); const c=project({x:i,y:0,z:-30}), d=project({x:i,y:0,z:30}); ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke(); }}

function render() {
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  renderGrid();
  if (state.image) { const p1=project({x:-20,y:0,z:-20}), p2=project({x:20,y:0,z:-20}), p3=project({x:20,y:0,z:20}), p4=project({x:-20,y:0,z:20}); drawPoly([p1,p2,p3,p4],'rgba(255,255,255,0.58)','rgba(0,0,0,0.1)'); }

  state.objects.forEach((o)=>{ if (o.type==='wall'||o.type==='rack'||o.type==='door'){ const b=makeBox(o); drawPoly(b.left,o.id===state.selectedId?'#5f80d8':'#8aa1c7','#2d3d55'); drawPoly(b.right,o.id===state.hoveredId?'#7ca2f5':'#9db0d1','#2d3d55'); drawPoly(b.front,o.color || '#7a8fae','#2d3d55'); drawPoly(b.top,'rgba(240,245,255,0.85)','#2d3d55'); }
    if (o.type==='zone'){ const z=makeBox({...o,height:0.05}); drawPoly(z.top,'rgba(60,170,120,0.28)','rgba(25,80,50,0.8)'); const c=project({x:o.x,y:0.1,z:o.z}); ctx.fillStyle='#133'; ctx.font='12px sans-serif'; ctx.fillText(o.name||'Zone',c.x-20,c.y); }
  });

  if (state.draft) { if (state.mode==='wall'){ const a=project({x:state.draft.x1,y:0,z:state.draft.z1}), b=project({x:state.draft.x2,y:0,z:state.draft.z2}); ctx.strokeStyle='#243b6b'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } }
}

function screenToWorld(x,y){ const nx=(x-canvas.clientWidth/2)/state.camera.zoom; const ny=(canvas.clientHeight/2-y)/state.camera.zoom; const cz=Math.cos(state.camera.pitch); return {x:nx*10,z:ny*10/cz}; }
function hitTest(x,y){ let found=null; state.objects.forEach((o)=>{ const p=project({x:o.x,y:o.height||0,z:o.z}); if (Math.abs(p.x-x)<28 && Math.abs(p.y-y)<26) found=o; }); return found; }

function setMode(mode){ state.mode=mode; state.draft=null; modeButtons.forEach((b)=>b.classList.toggle('active',b.dataset.mode===mode)); }
modeButtons.forEach((b)=>b.addEventListener('click',()=>setMode(b.dataset.mode)));

canvas.addEventListener('pointerdown',(e)=>{ canvas.setPointerCapture(e.pointerId); state.pointer.down=true; state.pointer.startX=e.offsetX; state.pointer.startY=e.offsetY; const w=screenToWorld(e.offsetX,e.offsetY);
  if (state.mode==='wall'){ if (!state.draft) state.draft={x1:w.x,z1:w.z,x2:w.x,z2:w.z}; else { const dx=w.x-state.draft.x1,dz=w.z-state.draft.z1,len=Math.hypot(dx,dz)||1; state.objects.push({id:uid('wall'),type:'wall',name:'Mur',x:(w.x+state.draft.x1)/2,z:(w.z+state.draft.z1)/2,width:len,depth:0.1,height:3,rotation:Math.atan2(dz,dx)}); state.draft=null; state.needsSave=true; saveProject(); } }
  else if (state.mode==='door'){ state.objects.push({id:uid('door'),type:'door',name:'Porte',x:w.x,z:w.z,width:1.1,depth:0.15,height:2.1}); state.needsSave=true; saveProject(); }
  else if (state.mode==='rack' || state.mode==='zone'){ if (!state.draft) state.draft={x1:w.x,z1:w.z,x2:w.x,z2:w.z}; else { const width=Math.abs(w.x-state.draft.x1)||1,depth=Math.abs(w.z-state.draft.z1)||1; state.objects.push({id:uid(state.mode),type:state.mode,name:state.mode==='rack'?'Rack':'L2A',x:(w.x+state.draft.x1)/2,z:(w.z+state.draft.z1)/2,width,depth,height:state.mode==='rack'?2.5:0.1,color:state.mode==='rack'?'#7b90b1':'#3cab78'}); state.draft=null; state.needsSave=true; saveProject(); } }
  else if (state.mode==='calibrate'){ state.calibration.points.push(w); if (state.calibration.points.length===2){ const d=Math.hypot(state.calibration.points[1].x-state.calibration.points[0].x,state.calibration.points[1].z-state.calibration.points[0].z); const real=Number(prompt('Distance réelle entre les 2 points (mètres) ?', '5'))||5; state.calibration.pxToM = real / (d||1); state.calibration.points=[]; saveProject(); } }
  else if (state.mode==='select'){ const h=hitTest(e.offsetX,e.offsetY); state.selectedId=h?.id||null; syncProps(); }
  render();
});
canvas.addEventListener('pointermove',(e)=>{ const w=screenToWorld(e.offsetX,e.offsetY); if (state.mode==='wall' && state.draft){ state.draft.x2=w.x; state.draft.z2=w.z; }
  if ((e.buttons===1||state.pointer.down) && (e.altKey || state.mode==='select')){ state.camera.yaw += e.movementX*0.01; state.camera.pitch = Math.max(0.2,Math.min(1.3,state.camera.pitch+e.movementY*0.008)); }
  const h=hitTest(e.offsetX,e.offsetY); state.hoveredId=h?.id||null; if (h){ tooltip.hidden=false; tooltip.style.left=`${e.offsetX+12}px`; tooltip.style.top=`${e.offsetY+12}px`; tooltip.textContent=`${h.type} · ${h.name||''} · ${h.width?.toFixed(2)||'-'} x ${h.depth?.toFixed(2)||'-'} x ${h.height?.toFixed(2)||'-'}m`; } else tooltip.hidden=true;
  render();
});
canvas.addEventListener('pointerup',()=>{ state.pointer.down=false; });
canvas.addEventListener('wheel',(e)=>{ e.preventDefault(); state.camera.zoom = Math.max(20,Math.min(130,state.camera.zoom + (e.deltaY>0?-4:4))); render(); },{passive:false});

let pinchStart = null;
canvas.addEventListener('touchstart',(e)=>{ if (e.touches.length===2){ const dx=e.touches[0].clientX-e.touches[1].clientX; const dy=e.touches[0].clientY-e.touches[1].clientY; pinchStart=Math.hypot(dx,dy); } },{passive:true});
canvas.addEventListener('touchmove',(e)=>{ if (e.touches.length===2 && pinchStart){ const dx=e.touches[0].clientX-e.touches[1].clientX; const dy=e.touches[0].clientY-e.touches[1].clientY; const dist=Math.hypot(dx,dy); state.camera.zoom = Math.max(20,Math.min(130,state.camera.zoom+(dist-pinchStart)*0.03)); pinchStart=dist; render(); } },{passive:true});

document.getElementById('view-top').onclick=()=>{ state.camera.pitch=1.52; state.camera.yaw=0; render(); };
document.getElementById('view-iso').onclick=()=>{ state.camera.pitch=0.8; state.camera.yaw=-0.7; render(); };
document.getElementById('reset-camera').onclick=()=>{ state.camera={yaw:-0.7,pitch:0.8,zoom:58,panX:0,panY:0}; render(); };

document.getElementById('import-image').onclick=()=>imageInput.click();
document.getElementById('import-json').onclick=()=>jsonInput.click();
document.getElementById('export-json').onclick=()=>{ const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='map3d-project.json'; a.click(); URL.revokeObjectURL(a.href); };
document.getElementById('delete-project').onclick=async()=>{ state.objects=[]; state.imageData=null; state.image=null; await saveProject(); render(); };

imageInput.addEventListener('change', async (e)=>{ const f=e.target.files?.[0]; if (!f) return; const r=new FileReader(); r.onload=()=>{ state.imageData=r.result; loadImage(); saveProject(); }; r.readAsDataURL(f); });
jsonInput.addEventListener('change',(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); importData(data); saveProject(); render(); } catch { alert('JSON invalide'); } }; r.readAsText(f); });

const propsForm=document.getElementById('props-form');
function selected(){ return state.objects.find((o)=>o.id===state.selectedId); }
function syncProps(){ const o=selected(); const empty=document.getElementById('empty-props'); if(!o){ empty.hidden=false; propsForm.hidden=true; return; } empty.hidden=true; propsForm.hidden=false; document.getElementById('prop-name').value=o.name||''; document.getElementById('prop-type').value=o.type; document.getElementById('prop-width').value=o.width||1; document.getElementById('prop-depth').value=o.depth||1; document.getElementById('prop-height').value=o.height||1; }
propsForm.addEventListener('submit',(e)=>{ e.preventDefault(); const o=selected(); if(!o) return; o.name=document.getElementById('prop-name').value; o.width=Number(document.getElementById('prop-width').value)||o.width; o.depth=Number(document.getElementById('prop-depth').value)||o.depth; o.height=Number(document.getElementById('prop-height').value)||o.height; saveProject(); render(); });

function exportData(){ return { imageData: state.imageData, calibration: state.calibration, camera: state.camera, objects: state.objects }; }
function importData(data){ state.imageData=data.imageData||null; state.calibration=data.calibration||state.calibration; state.camera=data.camera||state.camera; state.objects=Array.isArray(data.objects)?data.objects:[]; loadImage(); syncProps(); }
function loadImage(){ if(!state.imageData){ state.image=null; return; } const img=new Image(); img.onload=()=>{ state.image=img; render(); }; img.src=state.imageData; }

function openDb(){ return new Promise((resolve,reject)=>{ const req=indexedDB.open(STORAGE_DB,1); req.onupgradeneeded=()=>req.result.createObjectStore(STORAGE_STORE); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
async function saveProject(){ const db=await openDb(); await new Promise((res,rej)=>{ const tx=db.transaction(STORAGE_STORE,'readwrite'); tx.objectStore(STORAGE_STORE).put(exportData(),STORAGE_KEY); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }
async function loadProject(){ try { const db=await openDb(); const data=await new Promise((res,rej)=>{ const tx=db.transaction(STORAGE_STORE,'readonly'); const req=tx.objectStore(STORAGE_STORE).get(STORAGE_KEY); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); if(data) importData(data); } catch (_) {} }

loadProject().then(()=>{ resize(); syncProps(); render(); });
