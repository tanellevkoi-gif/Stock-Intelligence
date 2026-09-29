const $=id=>document.getElementById(id);
const usd=n=>n==null?'Puudub':'$'+n.toFixed(2);
const num=n=>n==null?'Puudub':new Intl.NumberFormat('et-EE').format(n);
const pc=n=>`${n>=0?'+':''}${n.toFixed(2)}%`;
const date=s=>s?new Date(s).toLocaleString('et-EE',{timeZone:'Europe/Tallinn'}):'Puudub';
let serial=0, current=null, selectedPeriod='3K', selectedName=null;
function periodRows(rows){
 if(selectedPeriod==='1K')return rows.slice(-5);
 const last=new Date(rows.at(-1)?.date+'T12:00:00Z');
 if(!Number.isFinite(last.getTime()))return [];
 const from=new Date(last);
 if(selectedPeriod==='1Kuu')from.setUTCMonth(from.getUTCMonth()-1);
 if(selectedPeriod==='3K')from.setUTCMonth(from.getUTCMonth()-3);
 if(selectedPeriod==='6K')from.setUTCMonth(from.getUTCMonth()-6);
 if(selectedPeriod==='YTD')from.setUTCMonth(0,1);
 if(selectedPeriod==='1A')from.setUTCFullYear(from.getUTCFullYear()-1);
 return rows.filter(row=>new Date(row.date+'T12:00:00Z')>=from);
}
function averageVolume(rows,index){if(index<20)return null;const values=rows.slice(index-20,index).map(r=>r.volume);return values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0)/20:null}
function charts(d){
 const all=d.history||[], r=periodRows(all), priceEl=$('chart'), volumeEl=$('volumeChart');
 if(r.length<2){priceEl.textContent='Hinnaajalugu pole saadaval.';volumeEl.textContent='Mahuajalugu pole saadaval.';return}
 const refs=[d.structure?.support,d.structure?.resistance,d.latest.close].filter(Number.isFinite);
 const values=r.map(v=>v.close), min=Math.min(...values,...refs), max=Math.max(...values,...refs), pad=Math.max((max-min)*.12,.1), lo=min-pad, hi=max+pad;
 const width=Math.max(360,Math.min(900,priceEl.clientWidth||900)), plot=width-108;
 const x=i=>12+i*plot/(r.length-1), y=v=>12+(hi-v)/(hi-lo)*190;
 const path=values.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
 const guides=[['Tugi',d.structure?.support],['Vastupanu',d.structure?.resistance]].filter(([,v])=>Number.isFinite(v)&&v>=lo&&v<=hi).map(([label,v])=>`<line x1="12" x2="${12+plot}" y1="${y(v)}" y2="${y(v)}" stroke="#999" stroke-dasharray="5 5"/><text x="${width-90}" y="${y(v)+4}" font-size="10" fill="#555">${label} ${usd(v)}</text>`).join('');
 priceEl.innerHTML=`<svg viewBox="0 0 ${width} 230" preserveAspectRatio="none" aria-hidden="true">${guides}<path d="${path}" fill="none" stroke="#171717" stroke-width="2.5" vector-effect="non-scaling-stroke"/><circle cx="${x(r.length-1)}" cy="${y(d.latest.close)}" r="4" fill="#171717"/><text x="12" y="225" font-size="11" fill="#777">${r[0].date}</text><text x="${width-185}" y="225" font-size="11" fill="#777">${r.at(-1).date}</text></svg>`;
 priceEl.setAttribute('aria-label',`${d.ticker}: ${r.length} kauplemispäeva hinnapunktid. Viimane hind ${usd(d.latest.close)}. Tugi ${usd(d.structure?.support)}, vastupanu ${usd(d.structure?.resistance)}.`);
 const maxVolume=Math.max(1,...r.map(v=>v.volume||0)), barWidth=Math.max(2,plot/r.length*.7);
 const bars=r.map((row,i)=>row.volume==null?'':`<rect x="${x(i)-barWidth/2}" y="${80-row.volume/maxVolume*72}" width="${barWidth}" height="${row.volume/maxVolume*72}" fill="#777"/>`).join('');
 const averagePoints=r.map((row,i)=>{const original=all.findIndex(v=>v.date===row.date),avg=averageVolume(all,original);return avg==null?null:[x(i),80-avg/maxVolume*72]}).filter(Boolean);
 const averagePath=averagePoints.map(([a,b],i)=>`${i?'L':'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
 volumeEl.innerHTML=`<svg viewBox="0 0 ${width} 90" preserveAspectRatio="none" aria-hidden="true"><line x1="12" x2="${12+plot}" y1="80" y2="80" stroke="#ddd"/>${bars}${averagePath?`<path d="${averagePath}" fill="none" stroke="#171717" stroke-width="1.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`:''}<text x="${width-90}" y="28" font-size="10" fill="#555">20 p keskmine</text></svg>`;
 volumeEl.setAttribute('aria-label',`${d.ticker}: ${r.length} kauplemispäeva tegelikud kauplemismahud ja arvutatud 20 päeva keskmine.`);
 const show=e=>{const rect=e.currentTarget.getBoundingClientRect(),local=(e.clientX-rect.left)/rect.width*width,index=Math.max(0,Math.min(r.length-1,Math.round((local-12)/plot*(r.length-1)))),row=r[index],i=all.findIndex(v=>v.date===row.date),avg=averageVolume(all,i);$('chartTooltip').textContent=`${row.date} · hind ${usd(row.close)} · maht ${num(row.volume)} · 20 päeva keskmine ${num(avg)}`};
 for(const svg of [priceEl.firstElementChild,volumeEl.firstElementChild])for(const event of ['pointermove','pointerdown'])svg.addEventListener(event,show);
}
function scenarioChart(d){
 const s=d.structure||{},p=d.latest.close,hi=s.upperResistance??s.resistance??p,low=s.lowerSupport??s.support??p;
 const numbers=[p,hi,low].filter(Number.isFinite),min=Math.min(...numbers),max=Math.max(...numbers),span=Math.max(max-min,1),y=v=>110-(v-min)/span*80;
 $('scenarioChart').innerHTML=`<svg viewBox="0 0 600 140" preserveAspectRatio="none" aria-hidden="true"><circle cx="24" cy="${y(p)}" r="4" fill="#111"/><path d="M24 ${y(p)} L300 ${y(hi)} L550 ${y(hi)}" fill="none" stroke="#222" stroke-width="2"/><path d="M24 ${y(p)} L550 ${y(p)}" fill="none" stroke="#888" stroke-width="2" stroke-dasharray="5 4"/><path d="M24 ${y(p)} L300 ${y(low)} L550 ${y(low)}" fill="none" stroke="#555" stroke-width="2"/><text x="455" y="${Math.max(12,y(hi)-5)}" font-size="11">Positiivne</text><text x="455" y="${Math.max(12,y(p)-5)}" font-size="11">Baas</text><text x="455" y="${Math.min(135,y(low)+14)}" font-size="11">Negatiivne</text></svg>`;
 $('scenarioChart').setAttribute('aria-label',`Tingimuslikud suunad hinnast ${usd(p)}. Ülemine vaadeldud tase ${usd(hi)}, alumine ${usd(low)}. See ei ole prognoos.`);
}
function macro(ticker,m){
 $('macroGrid').replaceChildren();$('macroStatus').textContent=m?.stale?'Varasem vastus':m?'Andmed võivad hilineda':'Turuandmed pole saadaval';
 for(const [key,label,suffix] of [['nasdaq','Nasdaq',''],['sp500','S&P 500',''],['vix','VIX',''],['yield10','USA 10 a tootlus','%']]){
  const d=m?.[key], box=document.createElement('div');box.className='macro-item';
  const name=document.createElement('small');name.textContent=label;const value=document.createElement('b');value.textContent=d?`${d.value.toFixed(2)}${suffix}${key==='yield10'?'':` · ${pc(d.changePct)}`}`:'Pole saadaval';
  const foot=document.createElement('span');foot.className='fine';if(d){const a=document.createElement('a');a.href=d.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Yahoo Finance';foot.append(a,document.createTextNode(` · ${date(d.timestamp)}`))}else foot.textContent='Andmeid ei saadud';box.append(name,value,foot);$('macroGrid').append(box);
 }
 const n=m?.nasdaq, sp=m?.sp500, yield10=m?.yield10;
 $('backdrop').textContent=n?`Nasdaq ${pc(n.changePct)}`:'Turuandmed puuduvad';
 const marketFacts=`${n?`Nasdaq ${n.changePct>=0?'tõusis':'langes'} ${Math.abs(n.changePct).toFixed(2)}%. `:''}${yield10?`USA 10 aasta tootlus oli ${yield10.value.toFixed(2)}%. `:''}${m?.vix?`VIX oli ${m.vix.value.toFixed(2)}. `:''}`;
 const context=ticker==='NVO'?'NVO puhul jälgi lisaks ravimite ja tervishoiusektori uudiseid; neid siin ei ole.':(['IREN','CORZ'].includes(ticker)?'Riskivalmidus ja intressikeskkond võivad kasvu- ning andmekeskuste aktsiate tausta mõjutada; põhjuslikku seost üksiku aktsiaga ei saa neist järeldada.':'Need üldturu näitajad on kontekst, mitte tõend valitud aktsia liikumise põhjuse kohta; sektoripõhist kinnitatud andmestikku siin ei ole.');
 $('macroMeaning').textContent=n||yield10||m?.vix?marketFacts+context:'Turu tausta mõju ei saa praegu andmetega hinnata.';
}
function render(d){
 const s=d.structure||{}, sup=s.support,res=s.resistance;
 const trend=s.change20==null?'Puudub':s.change20>3?'Tõusev':s.change20< -3?'Langev':'Külgsuunaline';
 const momentum=d.changePct>1?'Päevane hoog üles':d.changePct< -1?'Päevane hoog alla':'Päevane muutus väike';
 current=d;$('stockName').textContent=`· ${d.ticker}${selectedName?' · '+selectedName:''}`;$('delay').textContent=d.stale?'Varasem salvestatud vastus':'Andmed võivad hilineda';
 $('state').textContent=`${trend} · ${momentum.toLowerCase()}`;$('keyLevel').textContent=res?`Vastupanu ${usd(res)}`:sup?`Tugi ${usd(sup)}`:'Puudub';
 $('risk').textContent=sup?`Alla ${usd(sup)} sulgumine`:'Lähedast tuge ei leitud';$('trigger').textContent=res?`Üle ${usd(res)} püsimine`:'Lähedast vastupanu ei leitud';
 $('price').textContent=usd(d.latest.close);$('change').textContent=pc(d.changePct);$('change').className=d.changePct>=0?'up':'down';
 for(const [id,v] of [['previous',usd(d.previousClose)],['high',usd(d.latest.high)],['low',usd(d.latest.low)],['volume',num(d.latest.volume)],['ratio',d.volumeRatio==null?'Puudub':`${d.volumeRatio.toFixed(2)}×`],['timestamp',date(d.dataTimestamp)]])$(id).textContent=v;
 $('source').href=d.sourceUrl;$('retrieved').textContent=date(d.retrievedAt);charts(d);scenarioChart(d);
 $('bull').textContent=res?`Kui ${usd(res)} murdub ja hind püsib kõrgemal koos toetava mahuga, jälgi ${s.upperResistance?usd(s.upperResistance):'uue vastupanu kujunemist; järgmist ajaloolist taset pole'}.`:'Selget kõrgemat vastupanu ei leitud; jälgi uut hinnastruktuuri.';
 $('base').textContent=s.rangeLow!=null?`Kui hind jääb 20 päeva vahemikku ${usd(s.rangeLow)}–${usd(s.rangeHigh)}, jälgi konsolideerumist ja mahtu.`:'Vahemiku jaoks napib ajalugu.';
 $('bear').textContent=sup?`Kui ${usd(sup)} murdub ja hind püsib allpool, jälgi ${s.lowerSupport?usd(s.lowerSupport):'uue toe kujunemist; madalamat ajaloolist taset pole'}.`:'Selget madalamat tuge ei leitud; jälgi uut hinnastruktuuri.';
 $('trend').textContent=`${trend}; ${momentum.toLowerCase()}. 20 päeva muutus ${s.change20==null?'puudub':pc(s.change20)}.`;
 $('trendPeriods').textContent=['Lühike','Keskmine','Pikk'].map((label,i)=>`${label} ${d.trends?.[['short','medium','long'][i]]==null?'puudub':pc(d.trends[['short','medium','long'][i]])}`).join(' · ');
 $('recent').textContent=`Viimase hinna muutus ${pc(d.changePct)}; maht ${d.volumeRatio==null?'võrdluseta':`${d.volumeRatio.toFixed(2)}× 20 päeva keskmist`}.`;
 $('levels').textContent=`Tugi ${usd(sup)} / vastupanu ${usd(res)}.`;
 $('watch').textContent=res&&sup?`Jälgi ${usd(res)} ületamist või ${usd(sup)} murdumist koos päevamahu kinnitusega.`:'Jälgi järgmiste päevade hinnastruktuuri.';
 $('proxy').textContent=d.volumeRatio==null?'Suhtelist mahtu ei saanud arvutada; ostjate isikut ei saa järeldada.':`${d.volumeRatio>=1.5?'Tavapärasest suurem':'Tavapärane või väiksem'} päevamaht (${d.volumeRatio.toFixed(2)}×) ja ${d.changePct>=0?'hinnatõus':'hinnalangus'} on kaudsed aktiivsuse näitajad. ${d.changePct>=0?(d.volumeRatio>=1.5?'Liikumist toetab suurem aktiivsus.':'Tõus toimub tagasihoidlikuma mahuga.'):(d.volumeRatio>=1.5?'Langus toimub suurema aktiivsusega.':'Langus toimub väiksema mahuga.')} ${res&&d.latest.close>res?'Hind ületas varasema tipu; püsimine vajab kinnitust.':sup&&d.latest.close<sup?'Hind on varasema toe all; jälgi sulgemist.':'Lähima taseme läbimurret ei ole kinnitatud.'}`;
}
async function load(ticker){
 const id=++serial;document.querySelectorAll('[data-ticker]').forEach(b=>{b.classList.toggle('active',b.dataset.ticker===ticker);b.setAttribute('aria-pressed',String(b.dataset.ticker===ticker))});
 $('result').hidden=true;$('status').textContent=`Laen ${ticker} andmeid…`;
 const market=fetch(`/api/market?ticker=${ticker}`).then(r=>{if(!r.ok)throw Error('Andmed pole praegu saadaval. Proovi mõne aja pärast uuesti.');return r.json()});
 const background=fetch('/api/macro').then(r=>r.ok?r.json():null).catch(()=>null);
 try{const d=await market;if(id!==serial)return;render(d);macro(ticker,null);$('result').hidden=false;$('status').textContent=d.stale?'Kuvatakse varasemat salvestatud vastust.':'';const m=await background;if(id===serial)macro(ticker,m)}catch(e){if(id===serial)$('status').textContent=e.message}
}
document.querySelectorAll('[data-ticker]').forEach(b=>b.addEventListener('click',()=>{selectedName=null;load(b.dataset.ticker)}));
document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{selectedPeriod=b.dataset.period;document.querySelectorAll('[data-period]').forEach(x=>x.classList.toggle('active',x===b));if(current)charts(current)}));
const searchInput=$('searchInput');let searchSeq=0;
async function search(q){
 const id=++searchSeq;$('searchResults').replaceChildren();$('searchStatus').textContent='Otsin…';
 try{const r=await fetch(`/api/search?q=${encodeURIComponent(q)}`),d=await r.json();if(id!==searchSeq)return;
  if(!r.ok)throw Error(d.error||'Otsing pole saadaval.');
  $('searchStatus').textContent=d.results.length?'Vali aktsia.':'Tulemusi ei leitud. Kontrolli sümbolit.';
  for(const item of d.results){const b=document.createElement('button');b.type='button';b.setAttribute('role','option');const name=document.createElement('span'),ticker=document.createElement('b');name.textContent=`${item.name} · ${item.exchange}`;ticker.textContent=item.ticker;b.append(ticker,name);b.addEventListener('click',()=>{selectedName=item.name;searchInput.value=item.ticker;$('searchResults').replaceChildren();$('searchStatus').textContent='';load(item.ticker)});$('searchResults').append(b)}
 }catch(e){if(id===searchSeq){if(/^[A-Za-z][A-Za-z0-9.-]{0,14}$/.test(q)){selectedName=null;$('searchStatus').textContent='Otsing pole saadaval; kontrollin sümbolit otse.';load(q.toUpperCase())}else $('searchStatus').textContent=e.message}}
}
$('stockSearch').addEventListener('submit',e=>{e.preventDefault();const q=searchInput.value.trim();if(q)search(q)});
load('IREN');
