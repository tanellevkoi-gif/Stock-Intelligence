const $=id=>document.getElementById(id);
const money=n=>'$'+Number(n).toFixed(2);
const number=n=>new Intl.NumberFormat('et-EE').format(n);
let selected='IREN', requestId=0;
async function load(ticker){
  selected=ticker;const current=++requestId;
  document.querySelectorAll('[data-ticker]').forEach(b=>{b.classList.toggle('active',b.dataset.ticker===ticker);b.setAttribute('aria-pressed',String(b.dataset.ticker===ticker))});
  $('result').hidden=true;$('status').textContent=`Laen ${ticker} andmeid…`;
  try{
    const response=await fetch(`/api/market?ticker=${encodeURIComponent(ticker)}`);
    if(!response.ok)throw Error('Andmed pole praegu saadaval. Proovi mõne aja pärast uuesti.');
    const d=await response.json();if(current!==requestId)return;
    $('price').textContent=money(d.latest.close);$('change').textContent=`${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}% võrreldes eelmise sulgemisega`;
    $('change').className=d.changePct>=0?'up':'down';$('date').textContent=`${d.ticker} · ${d.latest.date}`;
    $('volume').textContent=number(d.latest.volume);$('volumeText').textContent='Viimase saadaoleva kauplemispäeva aktsiate arv.';
    $('ratio').textContent=d.volumeRatio===null?'Puudub':d.volumeRatio.toFixed(2)+'×';
    $('range').textContent=`${money(d.range20.low)}–${money(d.range20.high)}`;
    $('reading').textContent=d.volumeRatio===null?'Mahu võrdlus puudub.':d.volumeRatio>=1.5?'Päevamaht ületas 20 päeva keskmist vähemalt 1,5 korda. Uuri sama päeva uudiseid ja hinnaliikumist; maht üksi ei näita, kes ostis.':`Päevamaht oli ${d.volumeRatio.toFixed(2)} korda eelneva 20 päeva keskmine. Üksnes selle näitaja järgi ei saa vaalategevust kinnitada.`;
    $('source').href=d.sourceUrl;$('retrieved').textContent=new Date(d.retrievedAt).toLocaleString('et-EE',{timeZone:'Europe/Tallinn'});
    $('status').textContent='';$('result').hidden=false;
  }catch(e){if(current!==requestId)return;$('status').textContent=e.message}
}
document.querySelectorAll('[data-ticker]').forEach(b=>b.addEventListener('click',()=>load(b.dataset.ticker)));
load(selected);
