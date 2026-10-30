// Run: node tests/regression.cjs (Node 18+). Fetches the same Three.js r128 used by the game.
// For offline testing set LITTLE_PLANE_THREE_PATH to the r128 three.min.js file.
// Scene physics and room transactions are simulated; these tests do not contact production Firebase.
(async()=>{
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const threeSource = process.env.LITTLE_PLANE_THREE_PATH ? fs.readFileSync(process.env.LITTLE_PLANE_THREE_PATH,'utf8') :
 await fetch('https://raw.githubusercontent.com/mrdoob/three.js/r128/build/three.min.js').then(r=>{if(!r.ok)throw new Error('Three.js r128 unavailable');return r.text()});
const threeContext={exports:{},module:{exports:{}}};threeContext.exports=threeContext.module.exports;
vm.runInNewContext(threeSource,threeContext);const THREE=threeContext.module.exports;
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const code=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim()).join('\n');
const elements=new Map();
function element(id=''){return {id,nodeType:1,nodeValue:'',style:{setProperty(){}},dataset:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(){},append(){},remove(){},setAttribute(){},getAttribute(){return null},addEventListener(){},querySelectorAll(){return []},closest(){return null},getContext(){return null},textContent:'',innerText:'',innerHTML:'',value:'',getBoundingClientRect(){return {left:0,top:0,width:1280,height:720}},focus(){}}}
const document={body:element('body'),hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},querySelectorAll(){return []},querySelector(){return null},createElement:element,createElementNS:(_,tag)=>element(tag),createTextNode:t=>({nodeType:3,nodeValue:t}),createDocumentFragment:()=>element(),createTreeWalker:()=>({nextNode(){return false}}),addEventListener(){}};
const timers=new Map();let nextTimer=0;
const fakeRef={child(){return this},on(){},off(){},get:async()=>({val:()=>null}),set:async()=>{},update:async()=>{},onDisconnect(){return {remove:async()=>{},cancel:async()=>{},update:async()=>{},set:async()=>{}}}};
const ctx=vm.createContext({THREE,document,console,innerWidth:1280,innerHeight:720,performance,URL,Blob,Map,Set,Float32Array,Float64Array,Uint8Array,ArrayBuffer,DataView,Math,Number,Date,JSON,Promise,NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}},Audio:class{},localStorage:{getItem(){return null},setItem(){}},navigator:{userAgent:'test'},requestAnimationFrame:cb=>{timers.set(++nextTimer,cb);return nextTimer},cancelAnimationFrame:id=>timers.delete(id),setTimeout:(cb)=>{timers.set(++nextTimer,cb);return nextTimer},clearTimeout:id=>timers.delete(id),setInterval:(cb)=>{timers.set(++nextTimer,cb);return nextTimer},clearInterval:id=>timers.delete(id),firebase:{initializeApp(){},database:Object.assign(()=>({ref:()=>fakeRef}),{ServerValue:{TIMESTAMP:0}})}});
ctx.window=ctx;ctx.addEventListener=()=>{};
vm.runInContext(code,ctx,{filename:'index-inline.js'});
const run=s=>vm.runInContext(s,ctx);
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name)}
test('All inline JavaScript initializes without errors',()=>assert.equal(typeof ctx.spawnMeteor,'function'));
run(`scene=new THREE.Scene();airplane=new THREE.Group();airplane.position.set(0,45,0);camera=new THREE.PerspectiveCamera(60,1280/720,.1,5000);camera.position.set(0,52,30);camera.lookAt(0,45,-50);camera.updateMatrixWorld();meteorEvent.active=true;`);
test('Meteors descend immediately and never track pilot position',()=>{
 run('spawnMeteor(.8)');const initial=run('meteorEvent.meteors[0].velocity.clone()');assert(initial.y<0);assert(Math.abs(initial.z)<=10);
 run('airplane.position.x=130;airplane.position.y=175;flightSpeed=400;');
 const after=run('meteorEvent.meteors[0].velocity');assert.equal(after.x,initial.x);assert.equal(after.z,initial.z);
});
test('Meteor scene can advance and release every particle',()=>{
 run(`for(let i=0;i<600;i++){updateMeteorEvent(1/60,i*3)} resetMeteorEvent(false)`);assert.equal(run('meteorEvent.meteors.length'),0)
});
test('Night retains dark sky while exposing terrain',()=>{const phases=run("DAY_NIGHT_PHASES.filter(p=>['Madrugada','Noite','Anoitecer'].includes(p.name))");for(const p of phases){assert(p.ambientIntensity>=.48);assert(p.hemiIntensity>=.48);assert(p.exposure>=.95)}});
test('Cloud ceiling remains above flight limits and resources reset',()=>{
 run('initFlightAtmosphere();updateFlightAtmosphere(1/60,0)');assert.equal(run('flightAtmosphere.clouds.count'),72);assert(run('flightAtmosphere.banks.every(b=>b.y>=305)'));run('resetFlightAtmosphere()');assert.equal(run('flightAtmosphere.root'),null)
});
test('Scenic events excluded from musical and multiplayer sessions',()=>{
 run("selectedGameMode='music';startScenicEvent('thermal')");assert.equal(run('flightAtmosphere.event'),null);
 run("selectedGameMode='normal';mpActive=true;startScenicEvent('thermal')");assert.equal(run('flightAtmosphere.event'),null);run('mpActive=false')
});
test('Thermal crossing rewards only once, event disposes cleanly',()=>{
 run("airplane.position.set(0,45,0);fuel=30;startScenicEvent('thermal');airplane.position.z=-620;updateFlightAtmosphere(.1,620)");assert.equal(run('fuel'),55);
 run('updateFlightAtmosphere(.1,620)');assert.equal(run('fuel'),55);run('resetFlightAtmosphere()')
});
test('Bird migration renders outlined gulls and completes three distant waves',()=>{
 run("dayNightManager={currentTime:.94};selectedGameMode='normal';mpActive=false;airplane.position.set(0,45,0);startScenicEvent('migration')");
 assert.equal(run('flightAtmosphere.eventWave'),1);
 assert(run("flightAtmosphere.eventRoot.children[0].children.some(part=>part.children.some(child=>child.userData.gullOutline))"));
 run("for(let i=0;i<3000&&flightAtmosphere.event==='migration';i++){airplane.position.z-=3;updateFlightAtmosphere(1/60,i*3)}");
 assert.equal(run('flightAtmosphere.event'),null);
 assert.equal(run('flightAtmosphere.eventWave'),3);
 run('resetFlightAtmosphere()')
});
test('Aurora simulates and terminates cleanly',()=>{
 run("dayNightManager={currentTime:.94};startScenicEvent('aurora');for(let i=0;i<1200;i++)updateFlightAtmosphere(1/60,i);resetFlightAtmosphere()");
 assert.equal(run('flightAtmosphere.event'),null)
});
test('Gulls do not steer away from the player',()=>{
 run("resetFlightAtmosphere();selectedGameMode='normal';mpActive=false;airplane.position.set(0,45,0);startScenicEvent('migration')");
 run("{airplane.position.x=130;const root=flightAtmosphere.eventRoot,bird=root.children[0],u=bird.userData;updateGullFlock(flightAtmosphere,.01)}");
 assert.equal(run('flightAtmosphere.eventRoot.position.x'),0);
 assert.equal(run('flightAtmosphere.eventRoot.children[0].position.x'),run('flightAtmosphere.eventRoot.children[0].userData.ox'));
 run('resetFlightAtmosphere()')
});
test('Gull collision reduces altitude and applies a short downward effect',()=>{
 run("resetFlightAtmosphere();selectedGameMode='normal';mpActive=false;shieldActive=false;targetY=45;pitchAngle=0;airplane.position.set(0,45,0);startScenicEvent('migration')");
 run("{const a=flightAtmosphere,b=a.eventRoot.children[0],u=b.userData,dt=.01;a.eventRoot.position.z=airplane.position.z-u.oz-GULL_SPEED*dt;airplane.position.x=a.eventRoot.position.x+u.ox;airplane.position.y=a.eventRoot.position.y+u.oy+Math.sin(a.time*1.4+u.phase)*1.2;airplane.position.z=a.eventRoot.position.z+GULL_SPEED*dt+u.oz}");
 const before=run('targetY');
 run('updateGullFlock(flightAtmosphere,.01)');
 assert(run('targetY<'+before));
 assert(run('flightAtmosphere.birdDropTimer>.8'));
 assert(run('airplane.position.y<45'));
 run('resetFlightAtmosphere()')
});
test('Graphics settings expose quality, resolution and chunk-distance presets',()=>{
 const settings=run('getGraphicsSettings()');
 assert.equal(settings.quality,'high');
 assert.equal(settings.renderChunks,18);
 assert.equal(settings.resolution,1);
 assert(run('GRAPHICS_QUALITY.ultra.shadowMapSize > GRAPHICS_QUALITY.high.shadowMapSize'));
 assert(run('getGraphicsRenderDistance({renderChunks:30}) > getGraphicsRenderDistance({renderChunks:10})'));
});
test('Touchscreen PCs stay in desktop mode while phones use mobile controls',()=>{
 const pc=run("detectDeviceProfile('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156','Windows',10)");
 assert.equal(pc.touch,true);assert.equal(pc.desktop,true);assert.equal(pc.mobile,false);
 const android=run("detectDeviceProfile('Mozilla/5.0 (Linux; Android 14) AppleWebKit Mobile','Android',5)");
 assert.equal(android.touch,true);assert.equal(android.mobile,true);
 const ipad=run("detectDeviceProfile('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit','MacIntel',5)");
 assert.equal(ipad.mobile,true);
});
test('Radio integration is restricted to desktop and hidden on mobile',()=>{
 assert.match(html,/function isDesktopRadioDevice\(\)\s*\{\s*return DEVICE_PROFILE\.desktop/);
 assert.match(html,/body\.touch-device #littlePlaneRadioInstall/);
 assert.match(html,/if \(!isDesktopRadioDevice\(\) \|\| pcRadioPollTimer\) return/);
});
test('Sound effects volume supports live adjustment, persistence and mute',()=>{
 run('setSoundEffectsVolume(.35,false)');assert.equal(run('soundEffectsVolume'),.35);
 run('setSoundEffectsVolume(0,false)');assert.equal(run('soundEffectsVolume'),0);
 assert.match(html,/id="sfxVolumeSlider" type="range"/);
 assert.match(html,/sfxMasterGain\.gain\.setTargetAtTime/);
});
test('Balloons and blimps have gentle motion and independent basket sway',()=>{
 assert.match(html,/e\.carRig\.rotation\.z/);
 assert.match(html,/e\.basketRig\.rotation\.z/);
 assert.match(html,/bobAmp: 2 \+ rng\(\) \* 1\.5/);
 assert.match(html,/driftAmp: 7 \+ rng\(\) \* 6/);
 assert.match(html,/driftZAmp/);
 assert.match(html,/width="250" height="250"/);
});
test('All biomes use continuous side mountain ranges and retain their own route settings',()=>{
 const grayBiome=run("BIOMES.find(b=>b.id==='tempestades')");
 assert(grayBiome.mountLateral>=230);assert(grayBiome.mountCentralChance<=.1);
 const snowyBiome=run("BIOMES.find(b=>b.id==='montanhas')");
 assert.equal(snowyBiome.mountLateral,190);assert.equal(snowyBiome.mountCentralChance,.22);
 assert.match(html,/Cordilheiras contínuas em TODO o mapa/);
 assert.match(html,/mountH: \[b\.mountH\[0\] \* \.72, b\.mountH\[1\] \* \.84\]/);
});
test('Grass appears as chunk geometry and is removed shortly after passing',()=>{
 run("scene=new THREE.Scene();activeEntities.length=0;spawnedMountains.length=0;spawnedLakes.length=0;_spawnGrass(-1200,BIOMES[0],getRng(-1200))");
 assert(run("activeEntities.some(e=>e.type==='grass' && e.mesh.geometry.attributes.position.count>0)"));
 assert.match(html,/const behindLimit = e\.type === 'grass' \? 45 : 200 \+ mountainRearExtent/);
});
test('Lake water is animated, irregular and scales detail with graphics quality',()=>{
 run("scene=new THREE.Scene();activeEntities.length=0;spawnedMountains.length=0;spawnedLakes.length=0;activeGraphicsSettings={quality:'ultra'};_spawnLake(-1200,0,'campos')");
 const lake=run("activeEntities.find(e=>e.type==='lake')");
 assert(lake);assert.equal(lake.quality,'ultra');
 assert(lake.waterMesh.geometry.attributes.position.count>350);
 assert(lake.radiusX>100&&lake.radiusZ>75);
 assert.match(html,/new THREE\.RingGeometry\(\.86, 1, profile\.segments\)/);
 assert.match(html,/radiusX = bw \* 1\.12/);
 assert.match(html,/shoreX = bw \* 1\.24/);
 assert.match(html,/reservationRadius = Math\.max\(shoreX, shoreZ\) \+ 24/);
 const before=Array.from(lake.waterMesh.geometry.attributes.position.array);
 run("updateLakeAnimation(activeEntities.find(e=>e.type==='lake'),3.7)");
 const after=Array.from(lake.waterMesh.geometry.attributes.position.array);
 assert(after.some((value,index)=>index%3===1&&Math.abs(value-before[index])>.01));
 assert(run("LAKE_QUALITY.ultra.segments>LAKE_QUALITY.low.segments&&LAKE_QUALITY.ultra.ripples>LAKE_QUALITY.low.ripples"));
});
test('Ground objects and grass are kept out of reserved lake water',()=>{
 run("scene=new THREE.Scene();activeEntities.length=0;spawnedMountains.length=0;spawnedLakes.length=0;activeGraphicsSettings={quality:'low'};_spawnLake(-1200,0,'campos');_spawnGrass(-1200,BIOMES[0],()=>.5);_spawnTree(-1200,0,'floresta')");
 assert.equal(run("activeEntities.filter(e=>e.type==='lake').length"),1);
 assert.equal(run("activeEntities.filter(e=>e.type==='grass'||e.type==='tree').length"),0);
});
test('Lake reservations are removed when the chunk is cleared',()=>{
 run("scene=new THREE.Scene();activeEntities.length=0;spawnedMountains.length=0;spawnedLakes.length=0;activeGraphicsSettings={quality:'low'};_spawnLake(-1200,0,'campos')");
 assert.equal(run("spawnedLakes.length"),1);
 run("clearWorld()");
 assert.equal(run("spawnedLakes.length"),0);
});
test('Every biome generates mountain meshes on both outer terrain edges',()=>{
 assert.match(html,/const flankRange = \{/);
 assert.match(html,/const innerOffset = b\.mountLateral \+ 105 \+ rng\(\) \* 22/);
 assert.match(html,/const outerOffset = b\.mountLateral \+ 220 \+ rng\(\) \* 28/);
 assert.match(html,/spawnMtn\(innerZ, side \* innerOffset, flankRange, false\)/);
 assert.match(html,/spawnMtn\(outerZ, side \* outerOffset, flankRange, false\)/);
 for(const biome of ['campos','floresta','montanhas','canions','tempestades','arquipelago']){
  run("scene=new THREE.Scene();activeEntities.length=0;spawnedMountains.length=0;spawnedLakes.length=0;selectedGameMode='normal';spawnChunk(-90000,BIOMES.find(b=>b.id==='"+biome+"'))");
  assert(run("activeEntities.some(e=>e.type==='mountain'&&e.mesh.position.x < -330)"),biome+' left');
  assert(run("activeEntities.some(e=>e.type==='mountain'&&e.mesh.position.x > 330)"),biome+' right');
 }
 assert.match(html,/patchCount = b\.id === 'canions' \? 9 : b\.id === 'tempestades' \? 38 :\s*b\.id === 'montanhas' \? 24 : 29/);
});
test('Blimps and balloons have visibly stronger drift, bob and suspension sway',()=>{
 assert.match(html,/driftAmp: 20 \+ rng\(\) \* 16/);
 assert.match(html,/bobAmp: 4\.5 \+ rng\(\) \* 3/);
 assert.match(html,/driftAmp: 16 \+ rng\(\) \* 12/);
 assert.match(html,/basketSwayP: \.04, basketSwayR: \.058/);
 assert.match(html,/e\.carRig\.position\.x = Math\.sin/);
});
test('Ground casts shadows so terrain blocks sunlight reaching low aircraft',()=>{
 assert.match(html,/ground\.castShadow = true/);
});
test('Radio card offers direct extension download and setup steps',()=>{
 assert.match(html,/little-plane-radio-extension-1\.1\.4\.zip/);
 assert.match(html,/Selecione a pasta <code>extension<\/code>/);
 assert.match(html,/id="lpRadioInstallAction" type="button"/);
});
const base={protocol:3,matchId:'test-round',startAt:10000,players:{player1:{ready:true,started:true,connected:true,health:240},player2:{ready:true,started:true,connected:true,health:0}}};
const battleResult={matchId:'test-round',startAt:10000,winner:'player1',reason:'destroyed'};
ctx.testRoom=base;ctx.testResult=battleResult;
test('No winner before start, with one player loading, or from stale round',()=>{
 assert.equal(run('validMatchResult(testRoom,testResult,9999,true)'),false);
 base.players.player2.started=false;assert.equal(run('validMatchResult(testRoom,testResult,15000,true)'),false);base.players.player2.started=true;
 battleResult.matchId='old-round';assert.equal(run('validMatchResult(testRoom,testResult,15000,true)'),false);battleResult.matchId='test-round';
 assert.equal(run('validMatchResult(testRoom,testResult,15000,true)'),true)
});
test('Missing health is not death; live health cannot cause victory',()=>{
 delete base.players.player2.health;assert.equal(run('validMatchResult(testRoom,testResult,15000,true)'),false);
 base.players.player2.health=240;assert.equal(run('validMatchResult(testRoom,testResult,15000,true)'),false);base.players.player2.health=0
});
test('Countdown damage and premature timeout are rejected',()=>{
 assert.equal(run('validMatchResult(testRoom,testResult,11000,true)'),false);battleResult.reason='time';assert.equal(run('validMatchResult(testRoom,testResult,50000,true)'),false);assert.equal(run('validMatchResult(testRoom,testResult,310000,true)'),true);battleResult.reason='destroyed'
});
test('Race finish rejects zero time and insufficient distance',()=>{
 ctx.raceResult={matchId:'test-round',startAt:10000,winner:'player1',reason:'finish',distance:12000,raceTimeMs:0};assert.equal(run('validMatchResult(testRoom,raceResult,60000)'),false);ctx.raceResult.raceTimeMs=45000;assert.equal(run('validMatchResult(testRoom,raceResult,60000)'),true);ctx.raceResult.distance=11999;assert.equal(run('validMatchResult(testRoom,raceResult,60000)'),false)
});
test('Intercept solves crossing target instead of aiming behind',()=>{
 run('battleRemotePlane=new THREE.Group();battleRemotePlane.position.set(0,0,680);battleRemoteTarget.vx=120;battleRemoteTarget.vy=0;battleRemoteTarget.vz=0;');const point=run('battleInterceptPoint(new THREE.Vector3())'),time=point.length()/680;assert(Math.abs(point.x-120*time)<.001)
});
test('Swept collision includes fast opposing movement between frames',()=>{
 const d=run('battleSegmentDistance(new THREE.Vector3(),new THREE.Vector3(0,0,-20),new THREE.Vector3(0,0,20))');assert.equal(d,0)
});
test('Old room listeners are inert after cleanup',()=>{
 run('battleActive=false;battleStarted=true;battleWaitTimer=setTimeout(()=>{},1);battleCleanupListeners()');assert.equal(run('battleStarted'),false);assert.equal(run('battleWaitTimer'),null)
});
console.log(`${passed} tests passed`);
// Exercise real room functions against two independent clients and one in-memory RTDB.
class MemoryDatabase {
 constructor(){this.data={};this.listeners=[]}
 read(path){return path.split('/').filter(Boolean).reduce((x,k)=>x?.[k],this.data)??null}
 write(path,value){const keys=path.split('/').filter(Boolean);let root=this.data;for(const k of keys.slice(0,-1))root=root[k]??={};if(value===null)delete root[keys.at(-1)];else root[keys.at(-1)]=structuredClone(value);for(const l of this.listeners){if(path.startsWith(l.path)||l.path.startsWith(path)){const v=structuredClone(this.read(l.path));queueMicrotask(()=>l.cb({val:()=>v,exists:()=>v!==null}))}}}
 ref(path){const db=this;return {path,child:key=>db.ref(path+'/'+key),get:async()=>({val:()=>structuredClone(db.read(path)),exists:()=>db.read(path)!==null}),set:async value=>db.write(path,value),update:async values=>{for(const [key,value]of Object.entries(values))db.write(path+'/'+key,value)},remove:async()=>db.write(path,null),transaction:async fn=>{const result=fn(structuredClone(db.read(path)));if(result!==undefined)db.write(path,result);return {committed:result!==undefined,snapshot:{val:()=>structuredClone(db.read(path))}}},on:(event,cb)=>{db.listeners.push({path,event,cb});queueMicrotask(()=>cb({val:()=>structuredClone(db.read(path))}));return cb},off:(event,cb)=>{db.listeners=db.listeners.filter(l=>!(l.path===path&&l.event===event&&l.cb===cb))},onDisconnect:()=>({remove:async()=>{},set:async()=>{},update:async()=>{},cancel:async()=>{}})}}
}
function client(database){
 const elems=new Map(),doc={...document,getElementById(id){if(!elems.has(id))elems.set(id,element(id));return elems.get(id)},body:element('body')};
 const c=vm.createContext({...ctx,document:doc,firebase:{initializeApp(){},database:Object.assign(()=>database,{ServerValue:{TIMESTAMP:0}})}});c.window=c;
 vm.runInContext(code,c);c.run=s=>vm.runInContext(s,c);c.run("updateCrazyGamesRoom=async()=>{};mpStartCountdown=async()=>{mpPreparing=true};battlePrepareMatch=async()=>{battlePreparing=true};");return c
}
(async()=>{
 const database=new MemoryDatabase(),host=client(database),join1=client(database),join2=client(database);
 await host.openCreateRoom();const roomCode=host.run('mpRoomCode');
 join1.document.getElementById('joinCodeInput').value=roomCode;join2.document.getElementById('joinCodeInput').value=roomCode;
 await Promise.all([join1.confirmJoinRoom(),join2.confirmJoinRoom()]);
 test('Concurrent race join admits exactly one player',()=>assert.equal([join1,join2].filter(c=>c.run('mpPlayerId')==='player2').length,1));
 test('Room creation starts without result or stale start time',()=>{const r=database.read('rooms/'+roomCode);assert.equal(r.startAt,0);assert(!r.result);assert.equal(r.protocol,3)});
 const db2=new MemoryDatabase(),bhost=client(db2),b1=client(db2),b2=client(db2);
 await bhost.battleCreateRoom();const bcode=bhost.run('battleRoomCode');b1.document.getElementById('battleJoinCode').value=bcode;b2.document.getElementById('battleJoinCode').value=bcode;
 await Promise.all([b1.battleConfirmJoin(),b2.battleConfirmJoin()]);
 test('Concurrent battle join cannot claim occupied slot',()=>assert.equal([b1,b2].filter(c=>c.run('battlePlayerId')==='player2').length,1));
 const bc=client(new MemoryDatabase());bc.run('battleRoomRef=db.ref("battleRooms/TEST01");battleMatchId="m1";battlePlayerId="player1";battleStartAt=Date.now()-5000;battleStarted=true;battleOwnHealth=240;battleEnemyHealth=0;');
 const br={protocol:3,matchId:'m1',status:'battling',startAt:bc.run('battleStartAt'),players:{player1:{connected:true,ready:true,started:true,health:240},player2:{connected:true,ready:true,started:false,health:0}}};
 await bc.run('battleRoomRef').set(br);await bc.battleCommitResult('player1','destroyed');
 test('Actual result transaction rejects missing start acknowledgement',()=>assert.equal(bc.run('battleResultSubmitting'),false));
 await bc.run('battleRoomRef').child('players/player2/started').set(true);await bc.battleCommitResult('player1','destroyed');
 const resultSnapshot=await bc.run('battleRoomRef').get();
 test('Actual result transaction accepts legitimate post-start destruction',()=>assert.equal(resultSnapshot.val().result.winner,'player1'));
 test('Free flight and battle progression stay separate',()=>{const save=ctx.defaultSave();ctx.recordRankScore(save,10000);ctx.recordRankScore(save,10000);ctx.recordRankScore(save,10000);assert.equal(save.rankIndex,10000);ctx.recordBattleRankResult(save,true,0);assert.equal(save.rankIndex,10000);assert(save.battleRankPoints>0)});
 test('Sideways projectiles preserve an exact zero Z direction',()=>{run('battleSpawnBullet("side",{dx:1,dy:0,dz:0,x:0,y:60,z:0,speed:680,damage:6,shooter:"player1"},false,0)');assert.equal(run('battleBullets.at(-1).direction.z'),0)});
 console.log(`TOTAL: ${passed} regression tests passed. Network tests use a simulated RTDB, not the production service.`);
})().catch(error=>{console.error(error);process.exitCode=1});
test('Every biome generates finite geometry after mountain fix',()=>{
 run('selectedGameMode="normal";dayNightManager=null;clearWorld();for(let i=0;i<BIOMES.length;i++)spawnChunk(-1500-i*2000,BIOMES[i]);');
 assert(run(`scene.children.every(root=>{let valid=true;root.traverse(o=>{const p=o.geometry?.attributes.position?.array;if(p)for(const v of p)if(!Number.isFinite(v))valid=false});return valid})`));
 assert(run("activeEntities.some(e=>e.type==='grass'&&e.mesh.geometry.attributes.position.count>0)"));run('clearWorld()')
});
test('Battle arena and simulation initialize without early damage',()=>{
 run(`renderer={toneMappingExposure:1};scene.fog=new THREE.Fog(0xaaaaaa,350,1500);ambientLight=new THREE.AmbientLight();hemiLight=new THREE.HemisphereLight();sunLight=new THREE.DirectionalLight();battlePlayerId='player2';battleBuildWorld();battleActive=true;battleEnded=false;battleResultSubmitting=false;battleStarted=false;battleSpeed=112;for(let i=0;i<60;i++)battleSimulate(1/60);`);
 assert.equal(run('battleOwnHealth'),240);assert(run('Number.isFinite(airplane.position.x)'));run('battleActive=false;battleDisposeWorld()')
});

})().catch(error=>{console.error(error);process.exitCode=1});
