const VALID_TICKER = /^[A-Z][A-Z0-9.-]{0,14}$/;
const cache = new Map();
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;

export function normalizeChart(ticker, payload) {
  const chart = payload?.chart?.result?.[0];
  const meta = chart?.meta;
  if (!meta || meta.symbol?.toUpperCase() !== ticker) throw Error('Invalid quote');
  const bars = chart.indicators?.quote?.[0];
  const timestamps = chart.timestamp || [];
  const rows = timestamps.map((time, i) => ({time, close: finite(bars?.close?.[i]), high: finite(bars?.high?.[i]), low: finite(bars?.low?.[i]), volume: finite(bars?.volume?.[i])})).filter(row => row.close !== null);
  const last = rows.at(-1);
  const price = finite(meta.regularMarketPrice) ?? last?.close;
  const previousClose = finite(meta.previousClose) ?? rows.at(-2)?.close ?? finite(meta.chartPreviousClose);
  if (!price || !previousClose || !last) throw Error('Incomplete quote');
  const quoteTime = finite(meta.regularMarketTime) ?? last.time;
  const baseline = rows.filter(row => row.time < last.time).slice(-20);
  const volumes = baseline.map(row => row.volume).filter(v => v !== null);
  const average = volumes.length === 20 ? volumes.reduce((a,b) => a+b, 0)/20 : null;
  const lows = baseline.map(row => row.low).filter(v => v !== null);
  const highs = baseline.map(row => row.high).filter(v => v !== null);
  const history = rows.slice(-260).map(row => ({date:new Date(row.time*1000).toISOString().slice(0,10), close:row.close, high:row.high, low:row.low, volume:row.volume}));
  const structure = levels(rows, price);
  const trends = trendPeriods(rows, price);
  return {
    ticker, history, structure, trends, securityName:meta.longName || meta.shortName || ticker, sector:null, historyTimestamp:history.at(-1)?.date ?? null, technicalMethod:'Eelmise 20 ja kuni 60 kauplemispäeva kõrgeimad ja madalaimad hinnad', latest: {close:price, date:new Date(quoteTime*1000).toISOString().slice(0,10), high:finite(meta.regularMarketDayHigh) ?? last.high, low:finite(meta.regularMarketDayLow) ?? last.low, volume:finite(meta.regularMarketVolume) ?? last.volume},
    previousClose, changePct:(price/previousClose-1)*100,
    volumeRatio:average && (finite(meta.regularMarketVolume) ?? last.volume) !== null ? (finite(meta.regularMarketVolume) ?? last.volume)/average : null,
    range20:lows.length === 20 && highs.length === 20 ? {low:Math.min(...lows),high:Math.max(...highs)} : null,
    dataTimestamp:new Date(quoteTime*1000).toISOString(), retrievedAt:new Date().toISOString(), source:'Yahoo Finance chart', sourceUrl:`https://finance.yahoo.com/quote/${ticker}/`
  };
}


// Observed prior-session extremes are conditional reference levels, not targets.
export function levels(rows, price) {
  const prior = rows.slice(0,-1).filter(r => r.high !== null && r.low !== null).slice(-60);
  const window = prior.slice(-20);
  if (window.length < 10) return null;
  const high20 = Math.max(...window.map(r => r.high));
  const low20 = Math.min(...window.map(r => r.low));
  const high60 = Math.max(...prior.map(r => r.high));
  const low60 = Math.min(...prior.map(r => r.low));
  const supports = [...new Set([low20, low60].filter(v => v < price))].sort((a,b)=>b-a);
  const resistances = [...new Set([high20, high60].filter(v => v > price))].sort((a,b)=>a-b);
  return {support:supports[0] ?? null, resistance:resistances[0] ?? null,
    lowerSupport:supports[1] ?? null, upperResistance:resistances[1] ?? null,
    rangeLow:low20, rangeHigh:high20,
    change20:window[0]?.close ? (price/window[0].close-1)*100 : null};
}

export function trendPeriods(rows, price) {
  const prior=rows.filter(r=>r.close !== null);
  const change=(sessions)=>prior.length>sessions && prior.at(-sessions-1)?.close>0 ? (price/prior.at(-sessions-1).close-1)*100 : null;
  return {short:change(5), medium:change(20), long:change(120)};
}

async function fetchQuote(ticker) {
  let failure;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const url = `https://${host}/v8/finance/chart/${ticker}?range=1y&interval=1d&includePrePost=false`;
      const response = await fetch(url, {signal:AbortSignal.timeout(12000), headers:{'User-Agent':'Mozilla/5.0', 'Accept':'application/json'}});
      if (!response.ok) throw Error(`Provider HTTP ${response.status}`);
      return normalizeChart(ticker, await response.json());
    } catch (error) { failure = error; }
  }
  throw failure;
}

export default async function handler(req, res) {
  const ticker = String(req.query?.ticker ?? new URL(req.url, 'http://localhost').searchParams.get('ticker') ?? '').toUpperCase();
  if (!VALID_TICKER.test(ticker)) return res.status(400).json({error:'Vigane aktsiasümbol'});
  const saved = cache.get(ticker);
  if (saved && Date.now() - saved.fetched < 60000) return res.status(200).json(saved.data);
  try {
    const data = await fetchQuote(ticker);
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(ticker, {data, fetched:Date.now()});
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Market data failed', ticker, error.message);
    res.setHeader('Cache-Control', 'no-store');
    if (saved) return res.status(200).json({...saved.data, stale:true});
    return res.status(503).json({error:'Andmed pole praegu saadaval. Proovi mõne aja pärast uuesti.'});
  }
}
