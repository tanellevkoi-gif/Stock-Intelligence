const TICKERS = new Set(['IREN', 'CORZ', 'NVO']);
export function parseCsv(input) {
  const rows = input.trim().split(/\r?\n/).slice(1).map(line => {
    const [date, open, high, low, close, volume] = line.split(',');
    return { date, open:+open, high:+high, low:+low, close:+close, volume:+volume };
  }).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.close) && r.close>0 && Number.isFinite(r.volume) && r.volume>=0);
  return rows.sort((a,b)=>a.date.localeCompare(b.date));
}
export function summarize(rows, ticker) {
  if(rows.length<22) throw new Error('Not enough daily history');
  const latest=rows.at(-1), prior=rows.at(-2), baseline=rows.slice(-21,-1);
  const avg=baseline.reduce((s,r)=>s+r.volume,0)/baseline.length;
  return {ticker, latest, previousClose:prior.close, changePct:((latest.close/prior.close)-1)*100, volumeRatio:avg?latest.volume/avg:null,
    range20:{low:Math.min(...baseline.map(r=>r.low)),high:Math.max(...baseline.map(r=>r.high))},
    source:'Stooq daily CSV', sourceUrl:`https://stooq.com/q/d/?s=${ticker.toLowerCase()}.us&i=d`, retrievedAt:new Date().toISOString(),
    note:'Daily end-of-day bars. Volume is activity, not proof of institutional buying or selling.'};
}
export default async function handler(req,res) {
  const ticker=String(req.query?.ticker || new URL(req.url,'http://localhost').searchParams.get('ticker') || '').toUpperCase();
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=3600');
  if(!TICKERS.has(ticker)) return res.status(400).json({error:'Unsupported ticker'});
  try {
    const upstream=await fetch(`https://stooq.com/q/d/l/?s=${ticker.toLowerCase()}.us&i=d`,{signal:AbortSignal.timeout(9000),headers:{'User-Agent':'Mozilla/5.0 (personal market dashboard)'}});
    if(!upstream.ok) throw Error(`Upstream ${upstream.status}`);
    const rows=parseCsv(await upstream.text());
    res.status(200).json(summarize(rows,ticker));
  } catch(e) { res.setHeader('Cache-Control','no-store'); res.status(503).json({error:'Market data temporarily unavailable. Try again later.'}); }
}
