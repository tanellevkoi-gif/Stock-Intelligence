const SYMBOLS = {nasdaq:'^IXIC', sp500:'^GSPC', vix:'^VIX', yield10:'^TNX'};
const cache = {data:null, fetched:0};

export function normalizeMacro(symbol, payload) {
  const meta = payload?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  const closes = payload?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(v => typeof v === 'number' && Number.isFinite(v)) || [];
  const previous = meta?.previousClose ?? (closes.length > 1 ? closes.at(-2) : null);
  const time = meta?.regularMarketTime;
  if (![price,previous,time].every(v => typeof v === 'number' && Number.isFinite(v)) || previous <= 0) throw Error('Incomplete index');
  return {value:price, changePct:(price/previous-1)*100,
    timestamp:new Date(time*1000).toISOString(), source:'Yahoo Finance',
    sourceUrl:`https://finance.yahoo.com/quote/${encodeURIComponent(SYMBOLS[symbol])}/`};
}
async function retrieve(symbol) {
  for (const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']) {
    try {
      const response = await fetch(`https://${host}/v8/finance/chart/${encodeURIComponent(SYMBOLS[symbol])}?range=5d&interval=1d`,
        {signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
      if (!response.ok) continue;
      return normalizeMacro(symbol,await response.json());
    } catch { /* try secondary host */ }
  }
  return null;
}
export default async function handler(req,res) {
  if (cache.data && Date.now()-cache.fetched < 120000) return res.status(200).json(cache.data);
  const values = await Promise.all(Object.keys(SYMBOLS).map(retrieve));
  const data = Object.fromEntries(Object.keys(SYMBOLS).map((key,i)=>[key,values[i]]));
  data.fed = null; // No verified current Fed event feed in this free source.
  if (values.some(Boolean)) {cache.data=data;cache.fetched=Date.now();}
  else if (cache.data) return res.status(200).json({...cache.data, stale:true});
  res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=300');
  return res.status(200).json(data);
}
