const $=id=>document.getElementById(id);
const usd=n=>n==null?'Puudub':'$'+n.toFixed(2);
const num=n=>n==null?'Puudub':new Intl.NumberFormat('et-EE').format(n);
const pc=n=>`${n>=0?'+':''}${n.toFixed(2)}%`;
const date=s=>s?new Date(s).toLocaleString('et-EE',{timeZone:'Europe/Tallinn'}):'Puudub';
let serial=0;
function chart(d){
 const r=d.history||[], el=$('chart');if(r.length<2){el.textContent='Hinnaajalugu pole saadaval.';return}
 const levels=[d.structure?.support,d.structure?.resistance,d.latest.close].filter(v=>v!=null);
 const vals=r.map(v=>v.close), min=Math.min(...vals,...levels), max=Math.max(...vals,...levels), pad=Math.max((max-min)*.12,.1), lo=min-pad, hi=max+pad;
 const x=i=>12+i*780/(r.length-1), y=v=>12+(hi-v)/(hi-lo)*220;
 const path=vals.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
 const guides=[['Tugi',d.structure?.support],['Vastupanu',d.structure?.resistance]].filter(v=>v[1]!=null).map(([label,v])=>`<line x1="12" x2="792" y1="${y(v)}" y2="${y(v)}" stroke="#999" stroke-dasharray="5 5"/><text x="800" y="${y(v)+4}" font-size="10" fill="#555">${label} ${usd(v)}</text>`).join('');
 el.innerHTML=`<svg viewBox="0 0 900 270" preserveAspectRatio="none" aria-hidden="true">${guides}<path d="${path}" fill="none" stroke="#171717" stroke-width="2.5" vector-effect="non-scaling-stroke"/><circle cx="${x(r.length-1)}" cy="${y(d.latest.close)}" r="5" fill="#171717"/><text x="12" y="260" font-size="11" fill="#777">${r[0].date}</text><text x="710" y="260" font-size="11" fill="#777">${r.at(-1).date}</text></svg>`;
 el.setAttribute('aria-label',`${d.ticker}: ${r.length} kauplemispäeva hind. Viimane ${usd(d.latest.close)}. Tugi ${usd(d.structure?.support)}, vastupanu ${usd(d.structure?.resistance)}.`);
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
 $('macroMeaning').textContent=ticker==='NVO'?(sp||yield10?`${sp?`S&P 500 ${sp.changePct>=0?'tõusis':'langes'} ${Math.abs(sp.changePct).toFixed(2)}%. `:''}${yield10?`USA 10 aasta tootlus oli ${yield10.value.toFixed(2)}%. `:''}NVO puhul jälgi ka ravimite ja tervishoiusektori uudiseid; neid siin ei ole.`:'Turu tausta mõju ei saa praegu andmetega hinnata.'):(n||yield10?`${n?`Nasdaq ${n.changePct>=0?'tõusis':'langes'} ${Math.abs(n.changePct).toFixed(2)}%. `:''}${yield10?`USA 10 aasta tootlus oli ${yield10.value.toFixed(2)}%. `:''}${n?.changePct<0?'Nõrgem Nasdaq võib riskialtitele kasvuaktsiatele survet lisada.':'Tugevam Nasdaq võib kasvuaktsiate riskivalmidust toetada.'} AI ja andmekeskuste meeleolu kohta eraldi näitajat siin ei ole.`:'Turu tausta mõju ei saa praegu andmetega hinnata.');
}
function render(d){
 const s=d.structure||{}, sup=s.support,res=s.resistance;
 const trend=s.change20==null?'Puudub':s.change20>3?'Tõusev':s.change20< -3?'Langev':'Külgsuunaline';
 const momentum=d.changePct>1?'Päevane hoog üles':d.changePct< -1?'Päevane hoog alla':'Päevane muutus väike';
 $('stockName').textContent=`· ${d.ticker}`;$('delay').textContent=d.stale?'Varasem salvestatud vastus':'Andmed võivad hilineda';
 $('state').textContent=`${trend} · ${momentum.toLowerCase()}`;$('keyLevel').textContent=res?`Vastupanu ${usd(res)}`:sup?`Tugi ${usd(sup)}`:'Puudub';
 $('risk').textContent=sup?`Alla ${usd(sup)} sulgumine`:'Lähedast tuge ei leitud';$('trigger').textContent=res?`Üle ${usd(res)} püsimine`:'Lähedast vastupanu ei leitud';
 $('price').textContent=usd(d.latest.close);$('change').textContent=pc(d.changePct);$('change').className=d.changePct>=0?'up':'down';
 for(const [id,v] of [['previous',usd(d.previousClose)],['high',usd(d.latest.high)],['low',usd(d.latest.low)],['volume',num(d.latest.volume)],['ratio',d.volumeRatio==null?'Puudub':`${d.volumeRatio.toFixed(2)}×`],['timestamp',date(d.dataTimestamp)]])$(id).textContent=v;
 $('source').href=d.sourceUrl;$('retrieved').textContent=date(d.retrievedAt);chart(d);
 $('bull').textContent=res?`Kui ${usd(res)} murdub ja hind püsib kõrgemal koos toetava mahuga, jälgi ${s.upperResistance?usd(s.upperResistance):'uue vastupanu kujunemist; järgmist ajaloolist taset pole'}.`:'Selget kõrgemat vastupanu ei leitud; jälgi uut hinnastruktuuri.';
 $('base').textContent=s.rangeLow!=null?`Kui hind jääb 20 päeva vahemikku ${usd(s.rangeLow)}–${usd(s.rangeHigh)}, jälgi konsolideerumist ja mahtu.`:'Vahemiku jaoks napib ajalugu.';
 $('bear').textContent=sup?`Kui ${usd(sup)} murdub ja hind püsib allpool, jälgi ${s.lowerSupport?usd(s.lowerSupport):'uue toe kujunemist; madalamat ajaloolist taset pole'}.`:'Selget madalamat tuge ei leitud; jälgi uut hinnastruktuuri.';
 $('trend').textContent=`${trend}; ${momentum.toLowerCase()}. 20 päeva muutus ${s.change20==null?'puudub':pc(s.change20)}.`;
 $('recent').textContent=`Viimase hinna muutus ${pc(d.changePct)}; maht ${d.volumeRatio==null?'võrdluseta':`${d.volumeRatio.toFixed(2)}× 20 päeva keskmist`}.`;
 $('levels').textContent=`Tugi ${usd(sup)} / vastupanu ${usd(res)}.`;
 $('watch').textContent=res&&sup?`Jälgi ${usd(res)} ületamist või ${usd(sup)} murdumist koos päevamahu kinnitusega.`:'Jälgi järgmiste päevade hinnastruktuuri.';
 $('proxy').textContent=d.volumeRatio==null?'Suhtelist mahtu ei saanud arvutada; ostjate isikut ei saa järeldada.':`${d.volumeRatio>=1.5?'Tavapärasest suurem':'Tavapärane või väiksem'} päevamaht (${d.volumeRatio.toFixed(2)}×) ja ${d.changePct>=0?'hinnatõus':'hinnalangus'} on kaudsed aktiivsuse näitajad. ${res&&d.latest.close>res?'Hind ületas varasema tipu; püsimine vajab kinnitust.':sup&&d.latest.close<sup?'Hind on varasema toe all; jälgi sulgemist.':'Lähima taseme läbimurret ei ole kinnitatud.'}`;
}
async function load(ticker){
 const id=++serial;document.querySelectorAll('[data-ticker]').forEach(b=>{b.classList.toggle('active',b.dataset.ticker===ticker);b.setAttribute('aria-pressed',String(b.dataset.ticker===ticker))});
 $('result').hidden=true;$('status').textContent=`Laen ${ticker} andmeid…`;
 const market=fetch(`/api/market?ticker=${ticker}`).then(r=>{if(!r.ok)throw Error('Andmed pole praegu saadaval. Proovi mõne aja pärast uuesti.');return r.json()});
 const background=fetch('/api/macro').then(r=>r.ok?r.json():null).catch(()=>null);
 try{const d=await market;if(id!==serial)return;render(d);macro(ticker,null);$('result').hidden=false;$('status').textContent=d.stale?'Kuvatakse varasemat salvestatud vastust.':'';const m=await background;if(id===serial)macro(ticker,m)}catch(e){if(id===serial)$('status').textContent=e.message}
}
document.querySelectorAll('[data-ticker]').forEach(b=>b.addEventListener('click',()=>load(b.dataset.ticker)));load('IREN');
