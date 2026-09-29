const TICKERS = new Set(['IREN', 'CORZ', 'NVO']);
const cache = new Map();

const finite = value =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function normalizeChart(ticker, payload) {
  const chart = payload?.chart?.result?.[0];
  const meta = chart?.meta;

  if (!meta || meta.symbol?.toUpperCase() !== ticker) {
    throw Error('Invalid quote');
  }

  const bars = chart.indicators?.quote?.[0];
  const timestamps = chart.timestamp || [];

  const rows = timestamps
    .map((time, i) => ({
      time,
      close: finite(bars?.close?.[i]),
      high: finite(bars?.high?.[i]),
      low: finite(bars?.low?.[i]),
      volume: finite(bars?.volume?.[i])
    }))
    .filter(row => row.close !== null);

  const last = rows.at(-1);

  const price =
    finite(meta.regularMarketPrice) ??
    last?.close;

  const previousClose =
    finite(meta.previousClose) ??
    finite(meta.chartPreviousClose);

  if (!price || !previousClose || !last) {
    throw Error('Incomplete quote');
  }

  const quoteTime =
    finite(meta.regularMarketTime) ??
    last.time;

  const baseline = rows
    .filter(row => row.time < last.time)
    .slice(-20);

  const volumes = baseline
    .map(row => row.volume)
    .filter(v => v !== null);

  const average =
    volumes.length === 20
      ? volumes.reduce((a, b) => a + b, 0) / 20
      : null;

  const lows = baseline
    .map(row => row.low)
    .filter(v => v !== null);

  const highs = baseline
    .map(row => row.high)
    .filter(v => v !== null);

  return {
    ticker,

    latest: {
      close: price,
      date: new Date(quoteTime * 1000)
        .toISOString()
        .slice(0, 10),

      high:
        finite(meta.regularMarketDayHigh) ??
        last.high,

      low:
        finite(meta.regularMarketDayLow) ??
        last.low,

      volume:
        finite(meta.regularMarketVolume) ??
        last.volume
    },

    previousClose,

    changePct:
      (price / previousClose - 1) * 100,

    volumeRatio:
      average &&
      (finite(meta.regularMarketVolume) ?? last.volume) !== null
        ? (finite(meta.regularMarketVolume) ?? last.volume) / average
        : null,

    range20:
      lows.length === 20 && highs.length === 20
        ? {
            low: Math.min(...lows),
            high: Math.max(...highs)
          }
        : null,

    dataTimestamp:
      new Date(quoteTime * 1000).toISOString(),

    retrievedAt:
      new Date().toISOString(),

    source: 'Yahoo Finance chart',

    sourceUrl:
      `https://finance.yahoo.com/quote/${ticker}/`
  };
}

async function fetchQuote(ticker) {
  let failure;

  for (const host of [
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com'
  ]) {
    try {
      const url =
        `https://${host}/v8/finance/chart/${ticker}` +
        `?range=2mo&interval=1d&includePrePost=false`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw Error(`Provider HTTP ${response.status}`);
      }

      return normalizeChart(
        ticker,
        await response.json()
      );
    } catch (error) {
      failure = error;
    }
  }

  throw failure;
}

export default async function handler(req, res) {
  const ticker = String(
    req.query?.ticker ??
      new URL(
        req.url,
        'http://localhost'
      ).searchParams.get('ticker') ??
      ''
  ).toUpperCase();

  if (!TICKERS.has(ticker)) {
    return res.status(400).json({
      error: 'Tundmatu aktsiasümbol'
    });
  }

  const saved = cache.get(ticker);

  if (
    saved &&
    Date.now() - saved.fetched < 60000
  ) {
    return res
      .status(200)
      .json(saved.data);
  }

  try {
    const data = await fetchQuote(ticker);

    cache.set(ticker, {
      data,
      fetched: Date.now()
    });

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    return res
      .status(200)
      .json(data);

  } catch (error) {
    console.error(
      'Market data failed',
      ticker,
      error.message
    );

    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    if (saved) {
      return res.status(200).json({
        ...saved.data,
        stale: true
      });
    }

    return res.status(503).json({
      error:
        'Andmed pole praegu saadaval. Proovi mõne aja pärast uuesti.'
    });
  }
}
