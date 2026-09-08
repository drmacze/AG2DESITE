import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";

const canvas = document.getElementById("weaponCanvas");
const loading = document.getElementById("modelLoader");
const errorBox = document.getElementById("modelError");
if (!canvas) throw new Error("AG2 viewer canvas is missing");

function ensureProgressUI(){
  if(!loading) return null;
  loading.innerHTML = `<div class="ag2-loader-head"><span class="ag2-loader-dot"></span><strong>AG2 3D REMASTER</strong></div><div class="ag2-loader-track"><i id="ag2LoaderBar"></i></div><div class="ag2-loader-meta"><span id="ag2LoaderStatus">Initializing renderer</span><b id="ag2LoaderPercent">0%</b></div>`;
  return {bar:document.getElementById("ag2LoaderBar"),status:document.getElementById("ag2LoaderStatus"),percent:document.getElementById("ag2LoaderPercent")};
}
const progressUI = ensureProgressUI();
let displayedProgress=0,targetProgress=0,progressRAF=0;
function setProgress(value,status){
  targetProgress=Math.max(targetProgress,Math.min(100,Math.round(value)));
  if(status&&progressUI?.status) progressUI.status.textContent=status;
  if(progressRAF) return;
  const tick=()=>{
    const diff=targetProgress-displayedProgress;
    displayedProgress+=Math.max(.3,diff*.14);
    if(displayedProgress>targetProgress-.2) displayedProgress=targetProgress;
    if(progressUI?.bar) progressUI.bar.style.transform=`scaleX(${displayedProgress/100})`;
    if(progressUI?.percent) progressUI.percent.textContent=`${Math.round(displayedProgress)}%`;
    window.dispatchEvent(new CustomEvent("ag2-model-progress",{detail:{progress:displayedProgress,status:progressUI?.status?.textContent||""}}));
    if(displayedProgress<targetProgress) progressRAF=requestAnimationFrame(tick); else progressRAF=0;
  };
  progressRAF=requestAnimationFrame(tick);
}
function fail(message){
  loading?.classList.add("loaded");
  if(errorBox){errorBox.hidden=false;const strong=errorBox.querySelector("strong");const small=errorBox.querySelector("small");if(strong)strong.textContent="AG2 3D model unavailable";if(small)small.textContent=message;}
}

let renderer;
try{setProgress(4,"Starting WebGL");renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});}
catch(error){fail("WebGL is unavailable on this browser.");throw error;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
setProgress(10,"Building studio lighting");

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(28,1,.03,50);
const initialCamera=new THREE.Vector3(3.55,.68,2.52);
camera.position.copy(initialCamera);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.rotateSpeed=.54;controls.zoomSpeed=.72;controls.minDistance=2.45;controls.maxDistance=5.6;controls.minPolarAngle=Math.PI*.2;controls.maxPolarAngle=Math.PI*.8;controls.target.set(0,-.02,.02);

const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.035).texture;scene.environment=env;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xe7ebf2,0x090305,1.18));
const key=new THREE.DirectionalLight(0xffffff,3.6);key.position.set(4,5,4.5);key.castShadow=true;key.shadow.mapSize.set(768,768);key.shadow.camera.near=.5;key.shadow.camera.far=12;key.shadow.bias=-.0002;scene.add(key);
const fill=new THREE.PointLight(0xaabbd2,6.4,9,2);fill.position.set(1.2,-1,3);scene.add(fill);
const rim=new THREE.SpotLight(0xb40c18,23,12,Math.PI*.23,.55,1.45);rim.position.set(-4.1,2.35,-4.2);rim.target.position.set(0,0,0);scene.add(rim,rim.target);
const warm=new THREE.PointLight(0xd3a45d,2.2,7,2);warm.position.set(-.9,2.8,2.1);scene.add(warm);

function makeNoiseTexture(kind="grain"){
  const size=96,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;let v;if(kind==="brush"){const stripe=Math.sin(y*2.5)*3+Math.sin(y*7.9)*1.4;v=126+stripe+(Math.random()-.5)*5;}else v=126+(Math.random()-.5)*18;v=Math.max(0,Math.min(255,Math.round(v)));data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.needsUpdate=true;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==="brush"?2:5,kind==="brush"?7:5);texture.colorSpace=THREE.NoColorSpace;return texture;
}
const polymerGrain=makeNoiseTexture("grain"),brushedMetal=makeNoiseTexture("brush");
const materials=[
  new THREE.MeshPhysicalMaterial({color:0x292c30,metalness:.92,roughness:.23,roughnessMap:brushedMetal,clearcoat:.26,clearcoatRoughness:.18,envMapIntensity:1.6}),
  new THREE.MeshPhysicalMaterial({color:0x0d0f12,metalness:.03,roughness:.6,bumpMap:polymerGrain,bumpScale:.015,clearcoat:.03,clearcoatRoughness:.75,envMapIntensity:1}),
  new THREE.MeshPhysicalMaterial({color:0x17191d,metalness:.84,roughness:.32,roughnessMap:brushedMetal,clearcoat:.1,clearcoatRoughness:.28,envMapIntensity:1.4}),
  new THREE.MeshPhysicalMaterial({color:0x202329,metalness:.98,roughness:.18,roughnessMap:brushedMetal,clearcoat:.32,clearcoatRoughness:.1,envMapIntensity:1.8}),
  new THREE.MeshPhysicalMaterial({color:0xb68a3c,metalness:.94,roughness:.22,clearcoat:.16,clearcoatRoughness:.2,envMapIntensity:1.55})
];
materials.forEach(m=>m.side=THREE.FrontSide);

const root=new THREE.Group();scene.add(root);const baseRotation={x:.035,y:-.22,z:-.018};root.rotation.set(baseRotation.x,baseRotation.y,baseRotation.z);
const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(4,3),new THREE.ShadowMaterial({color:0x000000,opacity:.25}));contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,-.78,.04);contactShadow.receiveShadow=true;scene.add(contactShadow);
const rounded=new RoundedBoxGeometry(1,1,1,2,.042);rounded.computeVertexNormals();
const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));

async function loadGeometrySource(){
  setProgress(16,"Loading AG2 geometry");
  const response=await fetch(`viewer.js?geometry=${Date.now()}`,{cache:"no-store"});
  if(!response.ok)throw new Error(`geometry source ${response.status}`);
  const total=Number(response.headers.get("content-length"))||0;
  if(!response.body){const text=await response.text();setProgress(32,"Geometry received");return text;}
  const reader=response.body.getReader(),decoder=new TextDecoder();let received=0,text="";
  while(true){const {done,value}=await reader.read();if(done)break;received+=value.byteLength;text+=decoder.decode(value,{stream:true});const ratio=total?Math.min(1,received/total):Math.min(.92,received/180000);setProgress(16+ratio*17,"Streaming AG2 geometry");}
  text+=decoder.decode();setProgress(34,"Geometry received");return text;
}
async function getAG2Matrices(){
  const source=await loadGeometrySource();await nextFrame();setProgress(38,"Decoding weapon structure");const match=source.match(/const\s+MODEL_MATRICES\s*=\s*(\[[\s\S]*?\]);/);if(!match)throw new Error("AG2 geometry data was not found");const data=Function(`"use strict";return (${match[1]})`)();setProgress(43,"Preparing materials");await nextFrame();return data;
}
function expandBounds(values,min,max){
  const tx=values[12],ty=values[13],tz=values[14],ex=.5*(Math.abs(values[0])+Math.abs(values[4])+Math.abs(values[8])),ey=.5*(Math.abs(values[1])+Math.abs(values[5])+Math.abs(values[9])),ez=.5*(Math.abs(values[2])+Math.abs(values[6])+Math.abs(values[10]));
  min.x=Math.min(min.x,tx-ex);min.y=Math.min(min.y,ty-ey);min.z=Math.min(min.z,tz-ez);max.x=Math.max(max.x,tx+ex);max.y=Math.max(max.y,ty+ey);max.z=Math.max(max.z,tz+ez);
}
async function buildModel(groups){
  const min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity),names=["AG2_slide","AG2_lower_receiver","AG2_magazine","AG2_barrel","AG2_round"],totalGroups=groups.length||1;
  for(let groupIndex=0;groupIndex<groups.length;groupIndex++){
    const matrices=groups[groupIndex];setProgress(46+(groupIndex/totalGroups)*40,`Rendering ${names[groupIndex]||`AG2 part ${groupIndex+1}`}`);
    const instanced=new THREE.InstancedMesh(rounded,materials[groupIndex]||materials[1],matrices.length);instanced.name=names[groupIndex]||`AG2_part_${groupIndex}`;instanced.castShadow=true;instanced.receiveShadow=false;instanced.frustumCulled=false;
    const matrix=new THREE.Matrix4();matrices.forEach((values,i)=>{matrix.fromArray(values);instanced.setMatrixAt(i,matrix);expandBounds(values,min,max);});instanced.instanceMatrix.needsUpdate=true;root.add(instanced);await nextFrame();
  }
  const center=new THREE.Vector3().addVectors(min,max).multiplyScalar(.5);root.position.copy(center).multiplyScalar(-1);root.position.y+=.03;contactShadow.position.y=(min.y-center.y)-.08;setProgress(90,"Compiling final render");await nextFrame();renderer.compile(scene,camera);setProgress(96,"Polishing reflections");await nextFrame();window.dispatchEvent(new CustomEvent("ag2-model-ready"));
}

let interacting=false,lastInteraction=performance.now(),scrollProgress=0,idleYaw=0,targetIdleYaw=0;
controls.addEventListener("start",()=>{interacting=true;lastInteraction=performance.now();});controls.addEventListener("end",()=>{interacting=false;lastInteraction=performance.now();});canvas.addEventListener("pointerdown",()=>lastInteraction=performance.now(),{passive:true});window.addEventListener("ag2-model-scroll",e=>scrollProgress=THREE.MathUtils.clamp(Number(e.detail)||0,0,1));window.addEventListener("ag2-reset-viewer",()=>{camera.position.copy(initialCamera);controls.target.set(0,-.02,.02);controls.update();idleYaw=0;targetIdleYaw=0;root.rotation.set(baseRotation.x,baseRotation.y,baseRotation.z);lastInteraction=performance.now();});
function resize(){const rect=canvas.getBoundingClientRect(),width=Math.max(1,Math.floor(rect.width)),height=Math.max(1,Math.floor(rect.height)),pr=renderer.getPixelRatio();if(canvas.width!==Math.floor(width*pr)||canvas.height!==Math.floor(height*pr)){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}}
let lastTime=performance.now(),firstRendered=false;
function render(now){resize();const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;if(root.children.length){if(!interacting&&now-lastInteraction>2500)targetIdleYaw+=dt*.095;idleYaw+=(targetIdleYaw-idleYaw)*Math.min(1,dt*3.2);root.rotation.x=baseRotation.x+scrollProgress*.055;root.rotation.y=baseRotation.y+idleYaw+scrollProgress*.12;}controls.update();renderer.render(scene,camera);if(root.children.length&&!firstRendered){firstRendered=true;setProgress(100,"Ready");setTimeout(()=>loading?.classList.add("loaded"),380);}requestAnimationFrame(render);}requestAnimationFrame(render);
getAG2Matrices().then(buildModel).catch(error=>{console.error("AG2 remaster viewer failed",error);fail("Reload the page to try again.");});
