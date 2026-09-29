const VALID_QUERY = /^[\p{L}\p{N} .&'-]{1,50}$/u;
const VALID_SYMBOL = /^[A-Z][A-Z0-9.-]{0,14}$/;
const hosts = ['query2.finance.yahoo.com','query1.finance.yahoo.com'];
export function cleanResults(payload) {
  return (payload?.quotes || []).filter(q=>q.quoteType==='EQUITY' && VALID_SYMBOL.test(q.symbol || '')).slice(0,8).map(q=>({ticker:q.symbol,name:q.shortname || q.longname || q.symbol,exchange:q.exchDisp || q.exchange || 'Puudub'}));
}
export default async function handler(req,res) {
  const q=String(req.query?.q ?? new URL(req.url,'http://localhost').searchParams.get('q') ?? '').trim();
  if (!VALID_QUERY.test(q)) return res.status(400).json({error:'Sisesta ettevõtte nimi või aktsiasümbol (kuni 50 märki).'});
  for(const host of hosts){
    try {
      const url=`https://${host}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
      const response=await fetch(url,{signal:AbortSignal.timeout(6500),headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
      if(!response.ok)continue;
      res.setHeader('Cache-Control','public, s-maxage=180, stale-while-revalidate=600');
      return res.status(200).json({results:cleanResults(await response.json())});
    }catch{ /* use alternate host */ }
  }
  res.setHeader('Cache-Control','no-store');
  return res.status(503).json({error:'Otsing pole praegu saadaval. Proovi aktsiasümboliga.'});
}
