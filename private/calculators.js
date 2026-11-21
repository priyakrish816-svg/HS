/* Hariharan Singaram: calculators module (served only to signed-in users) */

{
const $=id=>document.getElementById(id);
const f=(x,d=2)=>isFinite(x)?Number(x).toLocaleString('en-AU',{maximumFractionDigits:d,minimumFractionDigits:d}):'–';
const f0=x=>f(x,0),f1=x=>f(x,1);
const ICON={
 bearing:`<circle cx="44" cy="44" r="34" fill="none" stroke="#5aa2ff" stroke-width="6"/><circle cx="44" cy="44" r="16" fill="none" stroke="#5aa2ff" stroke-width="5"/>${Array.from({length:8},(_,i)=>`<circle cx="${(44+25*Math.cos(i*Math.PI/4)).toFixed(1)}" cy="${(44+25*Math.sin(i*Math.PI/4)).toFixed(1)}" r="5.5" fill="#ffc700"/>`).join('')}`,
 fft:`<path d="M8 72 H80" stroke="#8f9ca3" stroke-width="2"/>${[14,22,30,38,46,54,62,70].map((x,i)=>`<rect x="${x-2}" y="${72-[20,46,14,30,10,24,8,16][i]}" width="4" height="${[20,46,14,30,10,24,8,16][i]}" fill="#5aa2ff"/>`).join('')}<path d="M8 20 H80" stroke="#ffc700" stroke-width="2" stroke-dasharray="4 3"/>`,
 shaft:`<rect x="8" y="38" width="72" height="12" rx="3" fill="#9aa6ad"/><circle cx="26" cy="44" r="16" fill="none" stroke="#5aa2ff" stroke-width="5"/><path d="M58 22 a22 22 0 1 1 -6 40" fill="none" stroke="#ffc700" stroke-width="4"/><path d="M52 62 l-2 -9 8 3z" fill="#ffc700"/>`,
 units:`<path d="M8 44 C 20 14, 32 14, 44 44 S 68 74, 80 44" fill="none" stroke="#5aa2ff" stroke-width="4"/><path d="M8 44 C 20 30, 32 30, 44 44 S 68 58, 80 44" fill="none" stroke="#ffc700" stroke-width="3"/><text x="44" y="84" text-anchor="middle" font-size="12" fill="#8f9ca3">µm · mm/s · g</text>`,
 iso:`${['#2fb36b','#9bc53d','#ffb000','#e8251a'].map((c,i)=>`<rect x="10" y="${64-i*16}" width="68" height="14" rx="2" fill="${c}"/>`).join('')}<path d="M4 50 h10" stroke="#111" stroke-width="3"/>`,
 force:`${motorIcon()}`,
 grease:`<rect x="14" y="32" width="42" height="22" rx="5" fill="#e8251a"/><line x1="56" y1="43" x2="80" y2="43" stroke="#9aa6ad" stroke-width="4"/><line x1="30" y1="32" x2="18" y2="14" stroke="#9aa6ad" stroke-width="4" stroke-linecap="round"/><circle cx="82" cy="43" r="4" fill="#ffc700"/><rect x="18" y="54" width="10" height="20" rx="2" fill="#c9d2d7"/>`,
 clock:`<circle cx="44" cy="44" r="32" fill="none" stroke="#ffc700" stroke-width="5"/><path d="M44 22 V44 L60 54" fill="none" stroke="#5aa2ff" stroke-width="5" stroke-linecap="round"/><circle cx="44" cy="44" r="4" fill="#111"/>`,
 visc:`<path d="M44 10 C 30 32, 22 44, 22 56 a22 22 0 0 0 44 0 C 66 44, 58 32, 44 10z" fill="#ffc700"/><path d="M34 58 a10 10 0 0 0 10 10" fill="none" stroke="#fff" stroke-width="3"/>`,
 clean:`<rect x="12" y="14" width="64" height="60" rx="6" fill="#0a0e10"/><text x="44" y="50" text-anchor="middle" font-size="17" font-weight="700" fill="#ffc700">16/14/11</text>`,
 beta:`<path d="M10 24 H40 L48 44 L40 64 H10" fill="none" stroke="#8f9ca3" stroke-width="3"/><rect x="40" y="18" width="12" height="52" fill="#c9d2d7"/>${Array.from({length:9},(_,i)=>`<circle cx="${16+(i%3)*8}" cy="${32+Math.floor(i/3)*12}" r="2.5" fill="#6b4a2a"/>`).join('')}<path d="M52 44 H80" stroke="#ffc700" stroke-width="4"/><circle cx="70" cy="44" r="2.5" fill="#6b4a2a"/>`,
 spl:`<rect x="30" y="8" width="28" height="56" rx="8" fill="#e8ecef" stroke="#8f9ca3" stroke-width="2"/><rect x="35" y="30" width="18" height="28" rx="3" fill="#ffc700"/><rect x="38" y="64" width="12" height="12" fill="#9aa6ad"/><circle cx="44" cy="84" r="3" fill="#ffc700"/>`,
 conv:`<path d="M14 32 H70 l-10 -10 M74 56 H18 l10 10" fill="none" stroke="#5aa2ff" stroke-width="5" stroke-linecap="round"/><text x="44" y="50" text-anchor="middle" font-size="12" fill="#8f9ca3">cSt ⇄ SUS</text>`};
function motorIcon(){return `<rect x="10" y="26" width="44" height="36" rx="6" fill="#2f5e9e"/>${[16,24,32,40].map(x=>`<rect x="${x}" y="26" width="4" height="36" fill="#244c88"/>`).join('')}<rect x="54" y="40" width="12" height="8" fill="#9aa6ad"/><circle cx="72" cy="44" r="12" fill="none" stroke="#ffc700" stroke-width="4" stroke-dasharray="4 3"/>`}
const TEMP=[['Below 65 °C',1],['65 – 80 °C',.5],['80 – 93 °C',.2],['Above 93 °C',.1]];
const CONT=[['Light, non-abrasive dust',1],['Heavy, non-abrasive dust',.7],['Light, abrasive dust',.4],['Heavy, abrasive dust',.2]];
const MOIST=[['Humidity mostly below 80%',1],['Humidity 80 – 90%',.7],['Occasional condensation',.4],['Occasional water on housing',.1]];
const VIBF=[['Below 5 mm/s peak (0.2 in/s)',1],['5 – 10 mm/s peak',.6],['Above 10 mm/s peak (0.4 in/s)',.3]];
const POS=[['Horizontal shaft',1],['Shaft at 45°',.5],['Vertical shaft',.3]];
const DES=[['Ball bearing',10],['Cylindrical or needle roller',5],['Tapered or spherical roller',1]];
const VG=[[32,5.4],[46,6.8],[68,8.7],[100,11.2],[150,14.7],[220,19],[320,24],[460,30.6],[680,39]];
const sel=(arr,i=0)=>({type:'sel',options:arr.map(a=>a[0]),value:i});
const C=[
{id:'bearing-frequencies',cat:'v',icon:'bearing',title:'Bearing defect frequencies',desc:'BPFO, BPFI, BSF and FTF from bearing geometry, with a live spectrum of the fault peaks.',
 fields:[['rpm','Shaft speed',1480,'RPM'],['n','Number of rolling elements',9,''],['bd','Rolling element diameter',7.94,'mm'],['pd','Pitch diameter',39.04,'mm'],['ang','Contact angle',0,'°']],
 note:'Defaults are a typical 6205 deep-groove ball bearing. Use the manufacturer\'s published geometry or frequency factors where you have them.',
 how:'FTF = f/2 · (1 − Bd/Pd · cos θ) · BPFO = N·f/2 · (1 − Bd/Pd · cos θ) · BPFI = N·f/2 · (1 + Bd/Pd · cos θ) · BSF = Pd/(2·Bd) · f · (1 − (Bd/Pd · cos θ)²), where f is shaft speed in Hz.',
 run(v,box){const fr=v.rpm/60,r=v.bd/v.pd*Math.cos(v.ang*Math.PI/180),F={BPFO:v.n*fr/2*(1-r),BPFI:v.n*fr/2*(1+r),BSF:v.pd/(2*v.bd)*fr*(1-r*r),FTF:fr/2*(1-r)};
  box.res.innerHTML=`<div class="big">${Object.entries(F).map(([k,x],i)=>`<div class="${i===0?'hl':''}"><b>${f1(x)} Hz</b><span>${k} · ${f(x/fr,3)}×</span></div>`).join('')}</div>
  <table class="rtab"><thead><tr><th>Frequency</th><th>Hz</th><th>CPM</th><th>Orders</th></tr></thead><tbody><tr><td>1X running speed</td><td>${f(fr)}</td><td>${f0(v.rpm)}</td><td>1.000</td></tr>${Object.entries(F).map(([k,x])=>`<tr><td>${k}</td><td>${f(x)}</td><td>${f0(x*60)}</td><td>${f(x/fr,3)}</td></tr>`).join('')}</tbody></table>
  <div class="chk" id="bchk">${['BPFO','BPFI','BSF','FTF'].map((k,i)=>`<label><input type="checkbox" value="${k}" ${i<2?'checked':''}>${k}</label>`).join('')}<label><input type="checkbox" value="H" checked>Harmonics</label><label><input type="checkbox" value="SB">1X sidebands on BPFI</label></div>
  <div class="cfig"><svg id="bsvg"></svg></div>`;
  const svg=box.res.querySelector('#bsvg'),chk=box.res.querySelector('#bchk');
  const draw=()=>{const on=[...chk.querySelectorAll('input:checked')].map(i=>i.value),W=svg.clientWidth,H=svg.clientHeight,m={l:12,r:12,t:30,b:26},fm=Math.max(F.BPFI*3.3,fr*12),X=x=>m.l+x/fm*(W-m.l-m.r),Y=a=>H-m.b-a*(H-m.t-m.b);
   const col={BPFO:'#ffc700',BPFI:'#e8251a',BSF:'#2fb36b',FTF:'#c084fc'};let g=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="#2a363c"/>`;
   const step=fm>2000?500:fm>800?200:fm>300?100:50;for(let x=0;x<=fm;x+=step)g+=`<text x="${X(x)}" y="${H-8}" text-anchor="middle">${x}</text>`;
   let lc=0;const ln=(x,a,c,l)=>{if(x>fm)return;g+=`<line x1="${X(x)}" x2="${X(x)}" y1="${Y(0)}" y2="${Y(a)}" stroke="${c}" stroke-width="2.5"/>`;if(l)g+=`<text x="${X(x)}" y="${Y(a)-5-(lc++%2)*14}" text-anchor="middle" fill="${c}" style="fill:${c}">${l}</text>`};
   [1,2,3].forEach(h=>ln(fr*h,h===1?.5:.25/h,'#8f9ca3',h===1?'1X':''));
   Object.keys(F).forEach(k=>{if(!on.includes(k))return;(on.includes('H')?[1,2,3]:[1]).forEach(h=>{ln(F[k]*h,.85/h,col[k],h===1?k:'');if(k==='BPFI'&&on.includes('SB')){ln(F[k]*h-fr,.4/h,col[k]);ln(F[k]*h+fr,.4/h,col[k])}})});
   svg.innerHTML=g};
  chk.addEventListener('change',draw);requestAnimationFrame(draw);box.redraw=draw}},
{id:'fft-resolution',cat:'v',icon:'fft',title:'Fmax, lines and resolution',desc:'Resolution, sample rate and collection time from Fmax, lines of resolution, averages and overlap.',
 fields:[['fmax','Fmax',1000,'Hz'],['lines','Lines of resolution',1600,''],['avg','Averages',4,''],['ov','Overlap',50,'%']],
 note:'Finer resolution separates close peaks (for example 1X and 2× line frequency) but every average takes longer to collect.',
 how:'Resolution = Fmax ÷ lines · Sample rate = 2.56 × Fmax · Time per average T = lines ÷ Fmax · Total time = T × (1 + (averages − 1) × (1 − overlap)).',
 run(v,box){const res=v.fmax/v.lines,fs=2.56*v.fmax,T=v.lines/v.fmax,tot=T*(1+(v.avg-1)*(1-v.ov/100));
  box.res.innerHTML=`<div class="big"><div class="hl"><b>${f(res,3)} Hz</b><span>Resolution (${f1(res*60)} CPM per line)</span></div><div><b>${f(tot,2)} s</b><span>Total collection time</span></div><div><b>${f0(fs)} Hz</b><span>Sample rate</span></div><div><b>${f(T,3)} s</b><span>Time per average</span></div></div><p class="cnote">${f0(v.lines*2.56)} samples per time record. With a Hanning window, peaks need several lines between them to show as separate peaks.</p>`}},
{id:'fmax-from-speed',cat:'v',icon:'shaft',title:'Fmax from shaft speed',desc:'Pick a sensible Fmax for the fault you are looking for: general faults, bearings, gear mesh or vane pass.',
 fields:[['rpm','Shaft speed',1480,'RPM'],['type','Looking for',sel([['General faults (imbalance, misalignment, looseness)'],['Rolling element bearing defects'],['Gear mesh'],['Pump vane / fan blade pass']])],['z','Gear teeth or vanes / blades',23,''],['lines','Lines of resolution',1600,'']],
 note:'These are common rules of thumb. Sites and standards vary, so adjust to your own route standards.',
 how:'General: 10 × running speed · Bearings: 50 × running speed · Gears: 3.25 × gear mesh frequency (teeth × speed) · Vane or blade pass: 3 × (vanes × speed). The result is rounded up to a common analyser Fmax.',
 run(v,box){const fr=v.rpm/60,mult=[10,50,0,0][v.type],raw=v.type<2?fr*mult:v.type===2?3.25*v.z*fr:3*v.z*fr,std=[50,100,200,250,500,1000,2000,2500,5000,10000,20000,40000],pick=std.find(x=>x>=raw)||raw;
  box.res.innerHTML=`<div class="big"><div class="hl"><b>${f0(pick)} Hz</b><span>Suggested Fmax (${f0(pick*60)} CPM)</span></div><div><b>${f0(raw)} Hz</b><span>Calculated minimum</span></div><div><b>${f1(pick/fr)}×</b><span>Orders of running speed</span></div><div><b>${f(pick/v.lines,3)} Hz</b><span>Resolution at ${f0(v.lines)} lines</span></div></div>${v.type>=2?`<p class="cnote">${v.type===2?'Gear mesh':'Vane / blade pass'} frequency: ${f1(v.z*fr)} Hz (${f0(v.z*v.rpm)} CPM).</p>`:''}`}},
{id:'vibration-units',cat:'v',icon:'units',title:'Vibration units conversion',desc:'Convert between displacement, velocity and acceleration, and between RMS, peak and peak-to-peak.',
 fields:[['val','Amplitude',4.5,''],['unit','Measured as',sel([['Velocity, mm/s'],['Velocity, in/s'],['Displacement, µm'],['Displacement, mils'],['Acceleration, g'],['Acceleration, m/s²']])],['det','Detection',sel([['RMS'],['Peak'],['Peak-to-peak']])],['hz','Frequency',24.7,'Hz']],
 note:'Valid for a single-frequency (sinusoidal) signal. For a complex spectrum, convert each peak at its own frequency.',
 how:'Velocity = 2πf × displacement · Acceleration = 2πf × velocity · 1 g = 9.80665 m/s² · Peak = 1.414 × RMS · Peak-to-peak = 2 × peak.',
 run(v,box){const w=2*Math.PI*v.hz,toPk=[Math.SQRT2,1,.5][v.det],x=v.val*toPk;let vel;// m/s peak
  switch(v.unit){case 0:vel=x/1000;break;case 1:vel=x*.0254;break;case 2:vel=x*1e-6*w;break;case 3:vel=x*25.4e-6*w;break;case 4:vel=x*9.80665/w;break;case 5:vel=x/w}
  const D=vel/w,A=vel*w,rows=[['Velocity, mm/s',vel*1000],['Velocity, in/s',vel/.0254],['Displacement, µm',D*1e6],['Displacement, mils',D/25.4e-6],['Acceleration, g',A/9.80665],['Acceleration, m/s²',A]];
  box.res.innerHTML=`<div class="big"><div class="hl"><b>${f(vel*1000/Math.SQRT2,2)}</b><span>mm/s RMS velocity</span></div><div><b>${f(D*2e6,1)}</b><span>µm peak-to-peak</span></div><div><b>${f(A/9.80665,3)}</b><span>g peak</span></div></div><table class="rtab"><thead><tr><th>Unit</th><th>RMS</th><th>Peak</th><th>Pk-pk</th></tr></thead><tbody>${rows.map(([n,p])=>`<tr><td>${n}</td><td>${f(p/Math.SQRT2,3)}</td><td>${f(p,3)}</td><td>${f(2*p,3)}</td></tr>`).join('')}</tbody></table>`}},
{id:'iso-severity',cat:'v',icon:'iso',title:'ISO 10816-3 severity',desc:'Check overall velocity against the ISO 10816-3 zones for industrial machines by size and foundation.',
 fields:[['vel','Overall velocity (RMS, 10–1000 Hz)',3.2,'mm/s'],['grp','Machine group',sel([['Group 2: 15 – 300 kW'],['Group 1: 300 kW – 50 MW']])],['fnd','Foundation',sel([['Rigid'],['Flexible']])]],
 note:'Zone A: newly commissioned. B: unrestricted long-term operation. C: restricted operation, plan action. D: damage likely. ISO 10816-3 has been superseded by ISO 20816-3, which keeps similar zone limits; always follow your site\'s alarm limits.',
 how:'Zone boundaries A/B, B/C, C/D (mm/s RMS). Group 2 rigid: 1.4, 2.8, 4.5 · Group 2 flexible: 2.3, 4.5, 7.1 · Group 1 rigid: 2.3, 4.5, 7.1 · Group 1 flexible: 3.5, 7.1, 11.0.',
 run(v,box){const L=[[[1.4,2.8,4.5],[2.3,4.5,7.1]],[[2.3,4.5,7.1],[3.5,7.1,11]]][v.grp][v.fnd],z=v.vel<L[0]?0:v.vel<L[1]?1:v.vel<L[2]?2:3,top=L[2]*1.5;
  const N=['A','B','C','D'],T=['Good: new machine condition','Acceptable for long-term operation','Unsatisfactory: plan corrective action','Unacceptable: damage likely'],CL=['#2fb36b','#9bc53d','#ffb000','#e8251a'],edges=[0,...L,top];
  box.res.innerHTML=`<div class="big"><div class="hl" style="border-color:${CL[z]};box-shadow:inset 0 0 0 1px ${CL[z]}"><b>Zone ${N[z]}</b><span>${T[z]}</span></div><div><b>${f(v.vel,1)} mm/s</b><span>${f(v.vel/25.4,3)} in/s RMS</span></div></div>
  <div class="zbar">${N.map((n,i)=>`<div style="flex:${edges[i+1]-edges[i]};background:${CL[i]}">${n}</div>`).join('')}<span class="zmark" style="left:calc(${Math.min(99,v.vel/top*100)}% - 2px)"></span></div>
  <table class="rtab"><thead><tr><th>Boundary</th><th>mm/s RMS</th></tr></thead><tbody><tr><td>A / B</td><td>${L[0]}</td></tr><tr><td>B / C</td><td>${L[1]}</td></tr><tr><td>C / D</td><td>${L[2]}</td></tr></tbody></table>`}},
{id:'forcing-frequencies',cat:'v',icon:'force',title:'Forcing frequencies',desc:'Motor slip and pole pass, gear mesh, vane pass and belt frequencies for one machine train.',
 fields:[['line','Supply frequency',50,'Hz'],['poles','Motor poles',4,''],['rpm','Motor running speed',1480,'RPM'],['teeth','Gear teeth (on motor shaft)',23,''],['vanes','Pump vanes or fan blades',6,''],['sd','Driving sheave diameter',200,'mm'],['bl','Belt length',1600,'mm']],
 note:'Pole pass sidebands around 1X and 2× line frequency are classic signs of motor rotor bar problems.',
 how:'Synchronous speed = 120 × line ÷ poles · Slip frequency = (synchronous − actual) ÷ 60 · Pole pass = slip frequency × poles · Gear mesh = teeth × speed · Vane pass = vanes × speed · Belt = π × sheave diameter × speed ÷ (60 × belt length).',
 run(v,box){const sync=120*v.line/v.poles,slip=sync-v.rpm,sf=slip/60,pp=sf*v.poles,fr=v.rpm/60,R=[['1X running speed',fr],['Slip frequency',sf],['Pole pass frequency',pp],['2× line frequency',2*v.line],['Gear mesh frequency',v.teeth*fr],['Vane / blade pass',v.vanes*fr],['Belt frequency',Math.PI*v.sd*v.rpm/(60*v.bl)],['2× belt frequency',2*Math.PI*v.sd*v.rpm/(60*v.bl)]];
  box.res.innerHTML=`<div class="big"><div class="hl"><b>${f0(sync)} RPM</b><span>Synchronous speed</span></div><div><b>${f1(slip/sync*100)}%</b><span>Slip (${f0(slip)} RPM)</span></div></div><table class="rtab"><thead><tr><th>Frequency</th><th>Hz</th><th>CPM</th><th>Orders</th></tr></thead><tbody>${R.map(([n,x])=>`<tr><td>${n}</td><td>${f(x)}</td><td>${f0(x*60)}</td><td>${f(x/fr,2)}</td></tr>`).join('')}</tbody></table>`}},
{id:'grease-quantity',cat:'l',icon:'grease',title:'Bearing grease quantity',desc:'How much grease to add at each relubrication, and how many shots of your grease gun that is.',
 fields:[['D','Bearing outside diameter',100,'mm'],['B','Bearing width',25,'mm'],['loc','Grease enters',sel([['From the side of the bearing'],['Through a centre lubrication groove']])],['gun','Grease gun output',1.2,'g per shot']],
 note:'Weigh a few shots of your own gun: output varies between guns (often roughly 1 – 1.5 g per full stroke). Use ultrasound to stop when the friction signal drops.',
 how:'Replenishment quantity Gp = 0.005 × D × B grams when greasing from the side, or Gp = 0.002 × D × B grams through a centre groove (D and B in mm). Shots = Gp ÷ gun output.',
 run(v,box){const g=(v.loc?0.002:0.005)*v.D*v.B;box.res.innerHTML=`<div class="big"><div class="hl"><b>${f1(g)} g</b><span>Grease per relubrication</span></div><div><b>${f1(g/v.gun)}</b><span>Shots at ${f(v.gun,1)} g per shot</span></div><div><b>${f(g/28.35,2)} oz</b><span>Ounces</span></div><div><b>${f1(g/.9)} cm³</b><span>Volume (density about 0.9 g/cm³)</span></div></div>`}},
{id:'relube-interval',cat:'l',icon:'clock',title:'Relubrication interval',desc:'How often to regrease a bearing, corrected for temperature, contamination, moisture, vibration, position and bearing type.',
 fields:[['n','Shaft speed',1480,'RPM'],['d','Bearing bore',50,'mm'],['t','Housing temperature',sel(TEMP)],['c','Particle contamination',sel(CONT)],['m','Moisture',sel(MOIST)],['vb','Vibration',sel(VIBF)],['p','Position',sel(POS)],['b','Bearing type',sel(DES)]],
 note:'A starting point only. Refine the interval with grease condition, ultrasound readings and bearing history.',
 how:'T (hours) = K × [14,000,000 ÷ (n × √d) − 4 × d], where n is speed in RPM, d is bore in mm, and K is the product of the six correction factors. This is the widely used Noria relubrication formula.',
 run(v,box){const K=TEMP[v.t][1]*CONT[v.c][1]*MOIST[v.m][1]*VIBF[v.vb][1]*POS[v.p][1]*DES[v.b][1],base=14e6/(v.n*Math.sqrt(v.d))-4*v.d,T=K*base;
  box.res.innerHTML=T>0?`<div class="big"><div class="hl"><b>${f0(T)} h</b><span>Relubrication interval</span></div><div><b>${f1(T/24)} days</b><span>Continuous running</span></div><div><b>${f1(T/168)} weeks</b><span>Continuous running</span></div><div><b>${f(K,3)}</b><span>Correction factor K</span></div></div><p class="cnote">Base interval before corrections: ${f0(base)} h.</p>`:`<div class="big"><div class="hl" style="border-color:#e8251a"><b>Too fast</b><span>Speed and size are beyond what grease handles well. Consider oil lubrication.</span></div></div>`}},
{id:'viscosity-kappa',cat:'l',icon:'visc',title:'Oil viscosity and kappa',desc:'Viscosity at operating temperature, the minimum the bearing needs, and the kappa ratio between them.',
 fields:[['vg','Oil grade',sel(VG.map(g=>['ISO VG '+g[0]]),5)],['v100','Viscosity at 100 °C (0 = typical for the grade)',0,'cSt'],['T','Operating temperature',70,'°C'],['d','Bearing bore',50,'mm'],['D','Bearing outside diameter',90,'mm'],['n','Shaft speed',1480,'RPM']],
 note:'Kappa below 1 means a thin oil film and risk of wear. Aim for kappa between 1 and 4. Typical 100 °C values assume a viscosity index of about 95 – 100.',
 how:'Viscosity at temperature from the Walther equation (ASTM D341) through the 40 °C and 100 °C points. Required viscosity ν1 = 45,000 × n^−0.83 × dm^−0.5 for n < 1000 RPM, or 4,500 × n^−0.5 × dm^−0.5 for n ≥ 1000 RPM, with dm = (d + D) ÷ 2. Kappa κ = ν ÷ ν1.',
 run(v,box){const g=VG[v.vg],v40=g[0],v100=v.v100>0?v.v100:g[1],W=x=>Math.log10(Math.log10(x+.7)),Bc=(W(v40)-W(v100))/(Math.log10(373.15)-Math.log10(313.15)),Ac=W(v40)+Bc*Math.log10(313.15),nu=10**(10**(Ac-Bc*Math.log10(v.T+273.15)))-.7,dm=(v.d+v.D)/2,nu1=v.n<1000?45000*v.n**-.83*dm**-.5:4500*v.n**-.5*dm**-.5,k=nu/nu1;
  const vd=k<1?['Too thin: boundary lubrication and wear risk','#e8251a']:k<=4?['Good: full film expected','#2fb36b']:['Very thick: extra friction and heat','#ffb000'];
  box.res.innerHTML=`<div class="big"><div class="hl" style="border-color:${vd[1]};box-shadow:inset 0 0 0 1px ${vd[1]}"><b>κ = ${f(k,2)}</b><span>${vd[0]}</span></div><div><b>${f1(nu)} cSt</b><span>Oil viscosity at ${f0(v.T)} °C</span></div><div><b>${f1(nu1)} cSt</b><span>Minimum required (ν1)</span></div><div><b>${f1(dm)} mm</b><span>Mean diameter dm</span></div></div>`}},
{id:'iso-4406',cat:'l',icon:'clean',title:'ISO 4406 cleanliness code',desc:'Turn particle counts at 4, 6 and 14 µm into an ISO 4406 code and compare it with your target.',
 fields:[['c4','Particles ≥ 4 µm(c) per mL',1200,''],['c6','Particles ≥ 6 µm(c) per mL',300,''],['c14','Particles ≥ 14 µm(c) per mL',25,''],['t4','Target code at 4 µm',16,''],['t6','Target code at 6 µm',14,''],['t14','Target code at 14 µm',11,'']],
 note:'Each step up in code roughly doubles the particle count.',
 how:'Each code covers a range of particles per mL: code 16 is above 320 up to 640, code 14 is above 80 up to 160, and so on, from the ISO 4406 table.',
 run(v,box){const U=[.02,.04,.08,.16,.32,.64,1.3,2.5,5,10,20,40,80,160,320,640,1300,2500,5000,1e4,2e4,4e4,8e4,16e4,32e4,64e4,13e5,25e5],code=c=>c<=0?0:(U.findIndex(u=>c<=u)+1)||'>28',got=[code(v.c4),code(v.c6),code(v.c14)],tg=[v.t4,v.t6,v.t14],ok=got.every((g,i)=>typeof g==='number'&&g<=tg[i]);
  box.res.innerHTML=`<div class="big"><div class="hl" style="border-color:${ok?'#2fb36b':'#e8251a'};box-shadow:inset 0 0 0 1px ${ok?'#2fb36b':'#e8251a'}"><b>${got.join('/')}</b><span>${ok?'Meets target':'Above target: filter or find the source'} ${tg.join('/')}</span></div></div><table class="rtab"><thead><tr><th>Size</th><th>Count / mL</th><th>Code</th><th>Target</th><th></th></tr></thead><tbody>${['≥ 4 µm','≥ 6 µm','≥ 14 µm'].map((n,i)=>`<tr><td>${n}</td><td>${f0([v.c4,v.c6,v.c14][i])}</td><td>${got[i]}</td><td>${tg[i]}</td><td>${typeof got[i]==='number'&&got[i]<=tg[i]?'✓':'✗'}</td></tr>`).join('')}</tbody></table>`}},
{id:'filter-beta',cat:'l',icon:'beta',title:'Filter beta ratio',desc:'Beta ratio and capture efficiency from upstream and downstream particle counts.',
 fields:[['size','Particle size',10,'µm'],['up','Upstream count',5000,'per mL'],['dn','Downstream count',25,'per mL']],
 note:'A β of 200 or more at the rated size is typical of a good-quality filter element.',
 how:'β(x) = upstream count ÷ downstream count at particle size x · Efficiency = (1 − 1 ÷ β) × 100%.',
 run(v,box){const b=v.up/v.dn;box.res.innerHTML=`<div class="big"><div class="hl"><b>β${f0(v.size)} = ${f0(b)}</b><span>Beta ratio</span></div><div><b>${f(100*(1-1/b),2)}%</b><span>Capture efficiency</span></div><div><b>1 in ${f0(b)}</b><span>Particles that pass through</span></div></div>`}},
{id:'auto-lubricator',cat:'l',icon:'spl',title:'Auto-lubricator setting',desc:'Choose the discharge period for a single-point automatic lubricator from the grease a bearing needs.',
 fields:[['g','Grease per relubrication',6.3,'g'],['h','Relubrication interval',720,'hours'],['size','Lubricator size',sel([['60 mL'],['120 mL'],['125 mL'],['250 mL']],2)],['rho','Grease density',.9,'g/mL']],
 note:'Get the grease amount and interval from the two calculators above. Check the setting against the lubricator manufacturer\'s chart.',
 how:'Grease per day = grams ÷ interval × 24 · Volume per day = grams per day ÷ density · Months per unit = lubricator volume ÷ (volume per day × 30.4). The suggested setting is the nearest standard period (1, 2, 3, 6 or 12 months) at or below that.',
 run(v,box){const ml=[60,120,125,250][v.size],gd=v.g/v.h*24,md=gd/v.rho,months=ml/(md*30.4),opts=[1,2,3,6,12],set=[...opts].reverse().find(o=>o<=months);
  box.res.innerHTML=`<div class="big"><div class="hl"><b>${set?set+' month'+(set>1?'s':''):'Under 1 month'}</b><span>Suggested discharge setting</span></div><div><b>${f(gd,2)} g</b><span>Grease per day</span></div><div><b>${f1(months)}</b><span>Months a ${ml} mL unit would last</span></div><div><b>${f1(md*30.4)} mL</b><span>Per month</span></div></div>${!set?'<p class="cnote">The bearing needs more than a single unit delivers in a month. Use a larger unit or a multi-point system.</p>':''}`}},
{id:'lube-conversions',cat:'l',icon:'conv',title:'Lubrication unit conversions',desc:'Viscosity in cSt and SUS, temperature, oil volumes and grease weights.',
 fields:[['cst','Kinematic viscosity at 40 °C',220,'cSt'],['tc','Temperature',70,'°C'],['l','Oil volume',20,'litres'],['gr','Grease mass',100,'g']],
 note:'SUS is calculated at 100 °F (37.8 °C) using the ASTM D2161 formula, which is close to the 40 °C value.',
 how:'SUS = 4.6324ν + (1 + 0.03264ν) ÷ ((3930.2 + 262.7ν + 23.97ν² + 1.646ν³) × 10⁻⁵) · °F = °C × 9/5 + 32 · 1 US gal = 3.78541 L · 1 imperial gal = 4.54609 L · 1 oz = 28.3495 g.',
 run(v,box){const n=v.cst,sus=4.6324*n+(1+.03264*n)/((3930.2+262.7*n+23.97*n*n+1.646*n**3)*1e-5);
  box.res.innerHTML=`<div class="big"><div class="hl"><b>${f0(sus)} SUS</b><span>${f0(n)} cSt</span></div><div><b>${f1(v.tc*9/5+32)} °F</b><span>${f1(v.tc)} °C</span></div></div><table class="rtab"><tbody><tr><td>${f1(v.l)} litres</td><td>${f(v.l/3.78541,2)} US gal</td></tr><tr><td></td><td>${f(v.l/4.54609,2)} imperial gal</td></tr><tr><td>${f0(v.gr)} g grease</td><td>${f(v.gr/28.3495,2)} oz</td></tr><tr><td></td><td>${f(v.gr/453.592,3)} lb</td></tr></tbody></table>`}}
];
const CAT={v:{n:'Vibration calculators',c:'#5aa2ff',d:'Bearing frequencies, analyser set-up, unit conversions, severity and forcing frequencies.'},l:{n:'Lubrication calculators',c:'#ffc700',d:'Grease quantities and intervals, oil viscosity, cleanliness, filtration and auto-lubricator settings.'}};
const view=$('calcview'),home=$('home');
const card=c=>`<a class="ccard" href="#c-${c.id}"><span class="cicon"><svg viewBox="0 0 88 88" aria-hidden="true">${ICON[c.icon]}</svg></span><span><b>${c.title}</b><span>${c.desc}</span></span></a>`;
function index(which){const tabs=[['calculators','All calculators'],['calc-vib','Vibration'],['calc-lube','Lubrication']];const cur=which==='v'?'calc-vib':which==='l'?'calc-lube':'calculators';
  view.innerHTML=`<div class="cv-head"><div class="wrap"><h1>Calculators</h1><p>Quick engineering calculators for vibration analysis and machinery lubrication. Every result updates as you type, and each calculator shows the formula it uses.</p><nav class="cv-tabs" aria-label="Calculator categories">${tabs.map(([h,n])=>`<a href="#${h}" ${h===cur?'aria-current="page"':''}>${h==='calc-vib'?'<i class="kd v"></i>':h==='calc-lube'?'<i class="kd l"></i>':''}${n}</a>`).join('')}</nav></div></div>
  <div class="band"><div class="wrap">${['v','l'].filter(k=>!which||which===k).map(k=>`<section class="cv-cat"><h2><i style="background:${CAT[k].c}"></i>${CAT[k].n}</h2><p style="color:var(--mute);margin:-10px 0 20px">${CAT[k].d}</p><div class="cgrid">${C.filter(c=>c.cat===k).map(card).join('')}</div></section>`).join('')}
  <p class="cnote" style="margin-top:30px">These calculators give engineering guidance. Always check results against manufacturer data and your site standards.</p></div></div>`}
function detail(c){const k=CAT[c.cat];
  view.innerHTML=`<div class="cv-head"><div class="wrap"><a class="back" href="#${c.cat==='v'?'calc-vib':'calc-lube'}">← ${k.n}</a><h1 style="margin-top:6px">${c.title}</h1><p>${c.desc}</p></div></div>
  <div class="band" style="padding-top:20px"><div class="wrap"><div class="calc"><form class="cform" id="cf" onsubmit="return false">${c.fields.map(([id,lab,val,unit])=>{const isSel=val&&typeof val==='object';return `<div class="cfield"><label for="f-${id}">${lab}</label><div class="in">${isSel?`<select id="f-${id}">${val.options.map((o,i)=>`<option value="${i}" ${i===val.value?'selected':''}>${o}</option>`).join('')}</select>`:`<input id="f-${id}" type="number" inputmode="decimal" step="any" value="${val}">${unit?`<span class="u">${unit}</span>`:''}`}</div></div>`}).join('')}<button type="button" class="btn" id="creset">Reset</button></form>
  <div class="cres"><div id="cr"></div><p class="cnote">${c.note}</p></div></div>
  <details class="how" open><summary>How it's calculated</summary><p>${c.how}</p></details>
  <h3 style="margin:34px 0 14px">More ${k.n.toLowerCase()}</h3><div class="cgrid">${C.filter(x=>x.cat===c.cat&&x.id!==c.id).slice(0,4).map(card).join('')}</div></div></div>`;
  const box={res:$('cr')},form=$('cf');
  const read=()=>{const v={};c.fields.forEach(([id,,val])=>{const el=$('f-'+id);v[id]=val&&typeof val==='object'?+el.value:parseFloat(el.value)});return v};
  const go=()=>{const v=read();if(Object.values(v).some(x=>!isFinite(x))){box.res.innerHTML='<p class="cnote">Enter a number in every field.</p>';return}c.run(v,box)};
  form.addEventListener('input',go);form.addEventListener('change',go);
  $('creset').addEventListener('click',()=>{c.fields.forEach(([id,,val])=>{const el=$('f-'+id);el.value=val&&typeof val==='object'?val.value:val});go()});
  go();
  const ro=new ResizeObserver(()=>box.redraw&&box.redraw());ro.observe(box.res)}
window.HSCalc={show(h){if(h.startsWith('c-')){const c=C.find(x=>'c-'+x.id===h);c?detail(c):index()}else index(h==='calc-vib'?'v':h==='calc-lube'?'l':null);document.title=(h.startsWith('c-')?(C.find(x=>'c-'+x.id===h)||{}).title+' · ':'')+'Calculators · Hariharan Singaram'}};
}
