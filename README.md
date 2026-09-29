# Vaalavaade

Simple Estonian market view for IREN, CORZ and NVO. The Vercel serverless function at `api/market.js` fetches the latest available Yahoo Finance chart quote, daily change, prior close, day high/low, volume and timestamp. The existing volume and historical range comparisons are shown when enough daily bars are available.

Run locally with Node.js 20 or later: `npm run dev`. Run checks with `npm test`. Deploy the repository root to Vercel without a build command or API key. The provider can delay, rate limit or change availability. A previously successful response is marked stale if a later provider request fails; otherwise the function returns a clear error. Quote timestamps are from the data provider, not the time of page load. These quotes are not a live order book.
