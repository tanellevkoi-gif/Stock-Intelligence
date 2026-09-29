import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {normalizeChart} from './market.js';
for (const ticker of ['IREN','CORZ','NVO']) {
  test(`${ticker} chart normalization`, () => {
    const now = Math.floor(Date.now()/1000);
    const payload = {chart:{result:[{meta:{symbol:ticker,regularMarketPrice:12,previousClose:10,regularMarketTime:now,regularMarketDayHigh:13,regularMarketDayLow:11,regularMarketVolume:1234},timestamp:Array.from({length:22},(_,i)=>now-(21-i)*86400),indicators:{quote:[{close:Array(22).fill(10),high:Array(22).fill(11),low:Array(22).fill(9),volume:Array(22).fill(1000)}]}}]}};
    const result = normalizeChart(ticker,payload);
    assert.equal(result.latest.close,12);
    assert.ok(Math.abs(result.changePct-20)<1e-9);
    assert.equal(result.previousClose,10);
    assert.equal(result.latest.high,13);
    assert.equal(result.latest.low,11);
    assert.equal(result.latest.volume,1234);
    assert.ok(result.dataTimestamp);
  });
}

test('history and levels are derived from prior observed bars', () => {
  const now=Math.floor(Date.now()/1000),ticker='IREN';
  const payload={chart:{result:[{meta:{symbol:ticker,regularMarketPrice:12,previousClose:11,regularMarketTime:now},timestamp:Array.from({length:30},(_,i)=>now-(29-i)*86400),indicators:{quote:[{close:Array(30).fill(10),high:Array(30).fill(13),low:Array(30).fill(9),volume:Array(30).fill(100)}]}}]}};
  const d=normalizeChart(ticker,payload);assert.equal(d.history.length,30);assert.equal(d.structure.support,9);assert.equal(d.structure.resistance,13);
});
