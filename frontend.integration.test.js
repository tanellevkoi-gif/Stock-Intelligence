import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {normalizeChart} from './api/market.js';
import {normalizeMacro} from './api/macro.js';

const ids=['chart','macroGrid','macroStatus','backdrop','macroMeaning','stockName','delay','state','keyLevel','risk','trigger','price','change','previous','high','low','volume','ratio','timestamp','source','retrieved','bull','base','bear','trend','recent','levels','watch','proxy','result','status','stockSearch','searchInput','searchResults','searchStatus','volumeChart','chartTooltip','scenarioChart','trendPeriods'];
function element(){return {textContent:'',innerHTML:'',hidden:false,className:'',children:[],dataset:{},setAttribute(k,v){this[k]=v},addEventListener(name,fn){(this.handlers ||= {})[name]=fn},get firstElementChild(){return this.svg ||= {handlers:{},addEventListener(name,fn){this.handlers[name]=fn},getBoundingClientRect(){return {left:0,width:900}}}},append(...v){this.children.push(...v)},replaceChildren(){this.children=[]}}}
function fixture(ticker){const now=1760000000;return normalizeChart(ticker,{chart:{result:[{meta:{symbol:ticker,regularMarketPrice:12,previousClose:11,regularMarketTime:now,regularMarketDayHigh:13,regularMarketDayLow:10,regularMarketVolume:1500},timestamp:Array.from({length:252},(_,i)=>now-(251-i)*86400),indicators:{quote:[{close:Array.from({length:252},(_,i)=>10+Math.sin(i/7)),high:Array(252).fill(13),low:Array(252).fill(9),volume:Array(252).fill(1000)}]}}]}})}
function macroFixture(){const value=normalizeMacro('nasdaq',{chart:{result:[{meta:{regularMarketPrice:105,previousClose:100,regularMarketTime:1760000000}}]}});return {nasdaq:value,sp500:value,vix:value,yield10:value}}
test('frontend uses API schema and updates chart, levels, scenarios and macro on ticker switch',async()=>{
 const elements=Object.fromEntries(ids.map(id=>[id,element()]));const buttons=['IREN','CORZ','NVO'].map(t=>({...element(),dataset:{ticker:t},handlers:{},addEventListener(name,fn){this.handlers[name]=fn},classList:{toggle(){}}}));
 const document={getElementById:id=>elements[id],querySelectorAll:selector=>selector==='[data-period]'?[]:buttons,createElement:()=>element(),createTextNode:text=>({textContent:text})};
 const fetch=async url=>({ok:true,json:async()=>url.includes('/api/macro')?macroFixture():url.includes('/api/search')?{results:[]}:fixture(new URL(url,'http://localhost').searchParams.get('ticker'))});
 const script=await readFile(new URL('./app.js',import.meta.url),'utf8');const context={document,fetch,Intl,Date,console};vm.runInNewContext(script+';globalThis.__test={periodRows,averageVolume,load}',context);
 for(const ticker of ['IREN','CORZ','NVO','NVDA','AAPL','TSLA']){if(ticker!=='IREN')await context.__test.load(ticker);await new Promise(r=>setTimeout(r,20));assert.match(elements.stockName.textContent,new RegExp(ticker));assert.match(elements.chart.innerHTML,/<svg/);assert.match(elements.bull.textContent,/\$/);assert.match(elements.base.textContent,/\$/);assert.match(elements.bear.textContent,/\$/);assert.match(elements.trend.textContent,/20 päeva/);assert.equal(elements.macroGrid.children.length,4);assert.notEqual(elements.backdrop.textContent,'Turuandmed puuduvad');assert.match(elements.volumeChart.innerHTML,/<rect/);assert.match(elements.scenarioChart.innerHTML,/<svg/)}
 const rows=fixture('NVDA').history;for(const period of ['1K','1Kuu','3K','6K','YTD','1A']){const count=vm.runInNewContext(`(function(rows){selectedPeriod='${period}';return periodRows(rows).length})`,context)(rows);assert.ok(count>1 && count<=rows.length,period)}
 assert.equal(context.__test.averageVolume(rows,20),1000);const svg=elements.chart.firstElementChild;svg.handlers.pointerdown({currentTarget:svg,clientX:300});assert.match(elements.chartTooltip.textContent,/hind.*maht.*20 päeva keskmine/)
});
