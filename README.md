# Vaalavaade

A small, personal dashboard for IREN, CORZ, and NVO. Daily close, volume compared to the previous 20 trading days, and historical 20-day price range. These are activity proxies, not evidence of a particular investor's trades.

## Run locally

Install Node.js 20 or later. Run `npm run dev` and open http://localhost:3000. No API key or install step is needed.

## Publish

Create a new GitHub repository, put these project files at its root, then import the repository as a new Vercel project. Vercel recognizes `api/market.js` as a serverless function and serves the root static files. No build command or environment variables are required. Use Vercel Hobby only for permitted personal, noncommercial use.

## Data and limitations

The server requests Stooq daily CSV on demand, caching successful responses for 15 minutes. Availability and symbol coverage may change; if unavailable, the page displays an error instead of fabricated data. The latest daily bar is not an intraday live quote. The provider's adjusted/unadjusted treatment should be checked before using these bars for research across corporate actions. No dark-pool, Level 2, options-flow, or institutional position feed is included. Before making decisions, verify any figure with an exchange or broker source.
