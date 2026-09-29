import {test} from 'node:test';import {strict as assert} from 'node:assert';import {parseCsv,summarize} from './market.js';
test('daily CSV sorts and compares previous 20 bars without including current volume',()=>{
 const lines=['Date,Open,High,Low,Close,Volume'];for(let n=22;n>=1;n--){let day=String(n).padStart(2,'0');lines.push(`2026-09-${day},10,12,8,${n===22?11:10},${n===22?200:100}`)}
 const s=summarize(parseCsv(lines.join('\n')),'IREN');assert.equal(s.latest.date,'2026-09-22');assert.equal(s.volumeRatio,2);assert.equal(s.range20.low,8);assert.equal(s.previousClose,10);
});
